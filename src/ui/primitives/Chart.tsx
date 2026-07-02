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
import { powerTransferFit } from '@/services/math/powerTransferFit';
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

  const selectedFit = selectedFitId
    ? (section.fits ?? []).find((fit) => fit.id === selectedFitId)
    : null;
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
    if (selectedFit.id === 'powerTransfer') {
      return powerTransferFit(points);
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

    // powerTransfer's parameters are A/B (P = A·x/(x+B)^2), deliberately not
    // the line-family a/b keys so the PDF's straight-line path stays inert.
    const parameters =
      selectedFit.id === 'powerTransfer' && fitResult.intercept !== undefined
        ? { A: fitResult.slope, B: fitResult.intercept }
        : fitResult.intercept === undefined
          ? { a: fitResult.slope }
          : { a: fitResult.slope, b: fitResult.intercept };

    setFitSelection(section.plotId, {
      model: selectedFit.id,
      parameters,
    });
  }, [fitResult, pointSignature, section.plotId, selectedFit, setFitSelection]);

  if (selectedFit && fitResult && Number.isFinite(minX) && Number.isFinite(maxX)) {
    const isPowerTransfer = selectedFit.id === 'powerTransfer';
    const yAt = (x: number) => {
      if (isPowerTransfer) {
        const b = fitResult.intercept ?? 0;
        return (fitResult.slope * x) / ((x + b) * (x + b));
      }
      return fitResult.intercept === undefined
        ? fitResult.slope * x
        : fitResult.slope * x + fitResult.intercept;
    };
    // Straight fits need only their endpoints; the nonlinear curve is sampled
    // densely so chart.js draws it smoothly (spec requires >= 50 samples).
    const sampleCount = isPowerTransfer ? 101 : 2;
    const linePoints: ScatterDataPoint[] = Array.from({ length: sampleCount }, (_, i) => {
      const x = minX + ((maxX - minX) * i) / (sampleCount - 1);
      return { x, y: yAt(x) };
    });
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

  const displayTitle = section.title ?? `${section.yLabel} vs. ${section.xLabel}`;

  return (
    <section className="chart">
      <h2>{displayTitle}</h2>
      <p>
        X-axis: {section.xLabel} | Y-axis: {section.yLabel}
      </p>
      <div style={{ height: 280 }}>
        <Scatter
          data={chartData}
          options={options}
          role="img"
          aria-label={`${displayTitle} scatter plot. X-axis ${section.xLabel}. Y-axis ${section.yLabel}.`}
        />
      </div>
    </section>
  );
}

export default Chart;
