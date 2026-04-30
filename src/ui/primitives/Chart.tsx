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

type ChartProps = {
  section: PlotSection;
  data: TableData;
};

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);
const isDev = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

type XYPoint = {
  x: number;
  y: number;
};

function asNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function linearLeastSquares(points: XYPoint[]): { slope: number; intercept: number } | null {
  if (points.length < 2) {
    return null;
  }

  const n = points.length;
  const sumX = points.reduce((acc, point) => acc + point.x, 0);
  const sumY = points.reduce((acc, point) => acc + point.y, 0);
  const sumXY = points.reduce((acc, point) => acc + point.x * point.y, 0);
  const sumXX = points.reduce((acc, point) => acc + point.x * point.x, 0);
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return null;
  }
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function Chart({ section, data }: ChartProps) {
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

  for (const fit of section.fits ?? []) {
    if (fit.id !== 'linear') {
      if (isDev) {
        console.warn(`[Chart] Unsupported fit "${fit.id}" for plot "${section.plotId}".`);
      }
      continue;
    }

    const linear = linearLeastSquares(points);
    if (!linear || !Number.isFinite(minX) || !Number.isFinite(maxX)) {
      continue;
    }

    const linePoints: ScatterDataPoint[] = [
      { x: minX, y: linear.slope * minX + linear.intercept },
      { x: maxX, y: linear.slope * maxX + linear.intercept },
    ];
    datasets.push({
      label: fit.label,
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
      legend: { display: true },
    },
  };

  return (
    <section className="chart">
      <h4>{section.plotId}</h4>
      <p>
        X-axis: {section.xLabel} | Y-axis: {section.yLabel}
      </p>
      <div style={{ height: 280 }}>
        <Scatter data={chartData} options={options} />
      </div>
    </section>
  );
}
