import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { kgToDisplay, unitLabel } from '../utils/units.js';

export default function BodyMetricsChart({ history, weightUnit }) {
  // El historial llega del más reciente al más viejo — la gráfica necesita orden cronológico
  const data = [...history]
    .filter((m) => m.weight_kg || m.body_fat_pct)
    .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date))
    .map((m) => ({
      date: new Date(m.recorded_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      peso: m.weight_kg ? kgToDisplay(m.weight_kg, weightUnit) : null,
      grasa: m.body_fat_pct ? Number(m.body_fat_pct) : null,
    }));

  if (data.length < 2) {
    return (
      <p className="muted">
        Se necesitan al menos 2 mediciones con peso o % de grasa para mostrar una gráfica de evolución.
      </p>
    );
  }

  return (
    <div className="body-chart">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="date" stroke="#93a3a6" fontSize={12} tickLine={false} axisLine={{ stroke: '#263140' }} />
          <YAxis
            yAxisId="peso"
            stroke="#00bfaa"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: unitLabel(weightUnit), angle: -90, position: 'insideLeft', fill: '#00bfaa', fontSize: 11 }}
          />
          <YAxis
            yAxisId="grasa"
            orientation="right"
            stroke="#f2b84a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: '%', position: 'insideRight', fill: '#f2b84a', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ background: '#131b24', border: '1px solid #263140', borderRadius: 10, fontSize: 13 }}
            labelStyle={{ color: '#edf3f2' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#93a3a6' }} />
          <Line
            yAxisId="peso"
            type="monotone"
            dataKey="peso"
            name={`Peso (${unitLabel(weightUnit)})`}
            stroke="#00bfaa"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#00bfaa' }}
            connectNulls
          />
          <Line
            yAxisId="grasa"
            type="monotone"
            dataKey="grasa"
            name="% Grasa corporal"
            stroke="#f2b84a"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#f2b84a' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
