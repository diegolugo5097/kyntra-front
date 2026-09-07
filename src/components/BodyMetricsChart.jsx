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

const MEASURE_COLORS = {
  pecho: '#00bfaa',
  torso: '#f2b84a',
  brazoIzq: '#8b7bf0',
  brazoDer: '#c084fc',
  piernaIzq: '#e8607a',
  piernaDer: '#38bdf8',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function chronological(history) {
  // El historial llega del más reciente al más viejo — la gráfica necesita orden cronológico
  return [...history].sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date));
}

export default function BodyMetricsChart({ history, weightUnit }) {
  const sorted = chronological(history);

  const weightData = sorted
    .filter((m) => m.weight_kg || m.body_fat_pct)
    .map((m) => ({
      date: formatDate(m.recorded_date),
      peso: m.weight_kg ? kgToDisplay(m.weight_kg, weightUnit) : null,
      grasa: m.body_fat_pct ? Number(m.body_fat_pct) : null,
    }));

  const measureData = sorted
    .filter((m) => m.chest_cm || m.waist_cm || m.arm_left_cm || m.arm_right_cm || m.leg_left_cm || m.leg_right_cm)
    .map((m) => ({
      date: formatDate(m.recorded_date),
      pecho: m.chest_cm ? Number(m.chest_cm) : null,
      torso: m.waist_cm ? Number(m.waist_cm) : null,
      brazoIzq: m.arm_left_cm ? Number(m.arm_left_cm) : null,
      brazoDer: m.arm_right_cm ? Number(m.arm_right_cm) : null,
      piernaIzq: m.leg_left_cm ? Number(m.leg_left_cm) : null,
      piernaDer: m.leg_right_cm ? Number(m.leg_right_cm) : null,
    }));

  return (
    <div className="body-chart">
      {weightData.length < 2 ? (
        <p className="muted">
          Se necesitan al menos 2 mediciones con peso o % de grasa para mostrar su gráfica de evolución.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={weightData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
              yAxisId="peso" type="monotone" dataKey="peso" name={`Peso (${unitLabel(weightUnit)})`}
              stroke="#00bfaa" strokeWidth={2.5} dot={{ r: 3, fill: '#00bfaa' }} connectNulls
            />
            <Line
              yAxisId="grasa" type="monotone" dataKey="grasa" name="% Grasa corporal"
              stroke="#f2b84a" strokeWidth={2.5} dot={{ r: 3, fill: '#f2b84a' }} connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {measureData.length >= 2 && (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={measureData} margin={{ top: 24, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" stroke="#93a3a6" fontSize={12} tickLine={false} axisLine={{ stroke: '#263140' }} />
            <YAxis
              stroke="#93a3a6"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: 'cm', angle: -90, position: 'insideLeft', fill: '#93a3a6', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ background: '#131b24', border: '1px solid #263140', borderRadius: 10, fontSize: 13 }}
              labelStyle={{ color: '#edf3f2' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#93a3a6' }} />
            <Line type="monotone" dataKey="pecho" name="Pecho (cm)" stroke={MEASURE_COLORS.pecho} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="torso" name="Torso (cm)" stroke={MEASURE_COLORS.torso} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="brazoIzq" name="Brazo izq. (cm)" stroke={MEASURE_COLORS.brazoIzq} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="brazoDer" name="Brazo der. (cm)" stroke={MEASURE_COLORS.brazoDer} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="piernaIzq" name="Pierna izq. (cm)" stroke={MEASURE_COLORS.piernaIzq} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="piernaDer" name="Pierna der. (cm)" stroke={MEASURE_COLORS.piernaDer} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
