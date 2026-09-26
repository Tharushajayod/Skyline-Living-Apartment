import type { ChartDataPoint } from '@/shared/types';

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export default function BarChart({ data, height = 200, color = 'bg-primary-500', formatValue }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((point, i) => {
          const barHeight = (point.value / max) * (height - 40);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group">
              <div className="relative w-full flex justify-center">
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap z-10">
                  {formatValue ? formatValue(point.value) : point.value}
                </div>
                <div
                  className={`w-full max-w-[48px] ${color} rounded-t-md transition-all duration-500 ease-smooth group-hover:opacity-80`}
                  style={{ height: `${barHeight}px`, animationDelay: `${i * 50}ms` }}
                />
              </div>
              <span className="text-xs text-navy-400 mt-2 text-center truncate w-full">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DonutChartProps {
  data: ChartDataPoint[];
  size?: number;
}

export function DonutChart({ data, size = 180 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const colors = ['#0d9488', '#1e3252', '#eab308', '#22c55e', '#f59e0b', '#ef4444', '#8fb1cd'];
  let cumulative = 0;
  const radius = size / 2 - 20;
  const strokeWidth = 24;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {data.map((segment, i) => {
            const fraction = segment.value / total;
            const dash = fraction * circumference;
            const offset = cumulative * circumference;
            cumulative += fraction;
            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-serif font-bold text-navy-900">{total}</span>
          <span className="text-xs text-navy-400">Total</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span className="text-navy-600 flex-1">{d.label}</span>
            <span className="font-medium text-navy-900">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function LineChart({ data, height = 200, formatValue }: LineChartProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const width = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 30 - ((d.value - min) / range) * (height - 50);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${width} ${height - 30} L 0 ${height - 30} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#lineGradient)" />
        <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="0.8" fill="#0d9488" className="opacity-0 hover:opacity-100">
            <title>{formatValue ? formatValue(p.value) : `${p.label}: ${p.value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-2 px-1">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-navy-400">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
