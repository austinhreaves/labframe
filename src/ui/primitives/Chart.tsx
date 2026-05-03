import { useEffect, useMemo } from 'react';

import type { PlotSection, TableData } from '@/domain/schema';
import {
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ScatterDataPoint,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import {
  formatFitLabel,
  linearLeastSquares,
  proportionalLeastSquares,
  type FitResult,
  type XYPoint,
} from '@/services/math/leastSquares';
import { useLabStore } from '@/state/labStore';

type ChartProps = {
  section: PlotSection;
  data: TableData;
};

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);
const isDev = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

function asNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function Chart({ section, data }: ChartProps) {
  const selectedFitId = useLabStore((state) => state.selectedFits[section.plotId] ?? null);
  const setFitSelection = useLabStore((state) => state.setFitSelection);
  const points: XYPoint[] = data
    .map((row) => {
      const x = asNumber(row[section.xCol]?.text ?? '');
      const y = asNumber(row[section.yCol]?.text ?? '');
      return x === null || y === null ? null : { x, y };
    })
    .filter((point): point is { x: number; y: number } => point !== null);

  const datasets: ChartData<'scatter'>['datasets'] = [
    {
      label: 'Observed',
      data: points,
      pointRadius: 4,
      backgroundColor: '#1558d6',
    },
  ];

  const minX = points.reduce((acc, point) => Math.min(acc, point.x), Number.POSITIVE_INFINITY);
  const maxX = points.reduce((acc, point) => Math.max(acc, point.x), Number.NEGATIVE_INFINITY);

  const selectedFit = selectedFitId ? (section.fits ?? []).find((fit) => fit.id === selectedFitId) : null;
  if (selectedFitId && !selectedFit && isDev) {
    console.warn(`[Chart] Selected fit "${selectedFitId}" not found for plot "${section.plotId}".`);
  }

  const fitResult = useMemo<FitResult | null>(() => {
    if (!selectedFit) {
      return null;
    }

    if (selectedFit.id === 'linear') {
      return linearLeastSquares(points);
    }
    if (selectedFit.id === 'proportional') {
      return proportionalLeastSquares(points);
    }
    if (isDev) {
      console.warn(`[Chart] Unsupported fit "${selectedFit.id}" for plot "${section.plotId}".`);
    }
    return null;
  }, [points, section.plotId, selectedFit]);

  const pointSignature = useMemo(
    () => points.map((point) => `${point.x.toPrecision(12)}:${point.y.toPrecision(12)}`).join('|'),
    [points],
  );

  useEffect(() => {
    if (!selectedFit || !fitResult) {
      setFitSelection(section.plotId, null);
      return;
    }

    const parameters =
      fitResult.intercept === undefined ? { a: fitResult.slope } : { a: fitResult.slope, b: fitResult.intercept };

    setFitSelection(section.plotId, {
      model: selectedFit.id,
      parameters,
    });
  }, [fitResult, pointSignature, section.plotId, selectedFit, setFitSelection]);

  if (selectedFit && fitResult && Number.isFinite(minX) && Number.isFinite(maxX)) {
    const yAt = (x: number) => (fitResult.intercept === undefined ? fitResult.slope * x : fitResult.slope * x + fitResult.intercept);
    const linePoints: ScatterDataPoint[] = [
      { x: minX, y: yAt(minX) },
      { x: maxX, y: yAt(maxX) },
    ];
    datasets.push({
      label: formatFitLabel(selectedFit, fitResult),
      data: linePoints,
      showLine: true,
      pointRadius: 0,
      borderColor: '#e66f00',
      borderWidth: 2,
    });
  }

  const chartData: ChartData<'scatter'> = { datasets };
  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: section.xLabel },
      },
      y: {
        type: 'linear',
        title: { display: true, text: section.yLabel },
      },
    },
    plugins: {
      legend: { display: true, position: 'bottom' },
    },
  };

  return (
    <section className="chart">
      <h2>{section.plotId}</h2>
      <p>
        X-axis: {section.xLabel} | Y-axis: {section.yLabel}
      </p>
      <div style={{ height: 280 }}>
        <Scatter
          data={chartData}
          options={options}
          role="img"
          aria-label={`${section.plotId} scatter plot. X-axis ${section.xLabel}. Y-axis ${section.yLabel}.`}
        />
      </div>
    </section>
  );
}

export default Chart;
