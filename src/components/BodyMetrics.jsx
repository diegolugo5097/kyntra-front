import { useEffect, useState, lazy, Suspense } from 'react';
import { api } from '../api.js';
import { kgToDisplay, displayToKg, unitLabel } from '../utils/units.js';

const BodyMetricsChart = lazy(() => import('./BodyMetricsChart.jsx'));

export default function BodyMetrics({ userId, canEdit, weightUnit, refreshKey }) {
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ height_cm: '', weight: '', body_fat_pct: '', recorded_date: '' });
  const [saving, setSaving] = useState(false);

  function load() {
    if (!userId) return;
    api.getBodyMetrics(userId).then(setHistory);
  }

  useEffect(load, [userId, refreshKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createBodyMetric(userId, {
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: displayToKg(form.weight, weightUnit),
        body_fat_pct: form.body_fat_pct ? Number(form.body_fat_pct) : null,
        recorded_date: form.recorded_date || undefined,
      });
      setForm({ height_cm: '', weight: '', body_fat_pct: '', recorded_date: '' });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta medición?')) return;
    await api.deleteBodyMetric(id);
    load();
  }

  return (
    <div className="body-metrics">
      <h3 className="section-title">Medidas corporales</h3>

      {canEdit && (
        <form className="body-metrics-form" onSubmit={handleSubmit}>
          <input
            type="date"
            value={form.recorded_date}
            onChange={(e) => setForm((f) => ({ ...f, recorded_date: e.target.value }))}
          />
          <input
            placeholder="Altura (cm)"
            style={{ width: 110 }}
            value={form.height_cm}
            onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
          />
          <input
            placeholder={`Peso (${unitLabel(weightUnit)})`}
            style={{ width: 110 }}
            value={form.weight}
            onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
          />
          <input
            placeholder="% grasa corporal"
            style={{ width: 130 }}
            value={form.body_fat_pct}
            onChange={(e) => setForm((f) => ({ ...f, body_fat_pct: e.target.value }))}
          />
          <button className="btn-secondary" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Registrar medición'}
          </button>
        </form>
      )}

      {history.length === 0 ? (
        <p className="muted">Aún no hay mediciones registradas.</p>
      ) : (
        <>
          <Suspense fallback={<p className="muted">Cargando gráfica…</p>}>
            <BodyMetricsChart history={history} weightUnit={weightUnit} />
          </Suspense>
          <table className="logs-table body-metrics-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Altura</th><th>Peso</th><th>% Grasa</th>{canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {history.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.recorded_date).toLocaleDateString('es-CO')}</td>
                <td>{m.height_cm ? `${m.height_cm} cm` : '—'}</td>
                <td>{m.weight_kg ? `${kgToDisplay(m.weight_kg, weightUnit)} ${unitLabel(weightUnit)}` : '—'}</td>
                <td>{m.body_fat_pct ? `${m.body_fat_pct}%` : '—'}</td>
                {canEdit && (
                  <td><button className="btn-link danger" onClick={() => handleDelete(m.id)}>✕</button></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}
