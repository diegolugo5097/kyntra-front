import { useEffect, useState, lazy, Suspense } from 'react';
import { api } from '../api.js';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { kgToDisplay, displayToKg, unitLabel } from '../utils/units.js';

const BodyMetricsChart = lazy(() => import('./BodyMetricsChart.jsx'));

const EMPTY_FORM = {
  height_cm: '',
  weight: '',
  body_fat_pct: '',
  chest_cm: '',
  waist_cm: '',
  arm_left_cm: '',
  arm_right_cm: '',
  leg_left_cm: '',
  leg_right_cm: '',
  recorded_date: '',
};

export default function BodyMetrics({ userId, canEdit, weightUnit, refreshKey }) {
  const confirm = useConfirm();
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
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
        chest_cm: form.chest_cm ? Number(form.chest_cm) : null,
        waist_cm: form.waist_cm ? Number(form.waist_cm) : null,
        arm_left_cm: form.arm_left_cm ? Number(form.arm_left_cm) : null,
        arm_right_cm: form.arm_right_cm ? Number(form.arm_right_cm) : null,
        leg_left_cm: form.leg_left_cm ? Number(form.leg_left_cm) : null,
        leg_right_cm: form.leg_right_cm ? Number(form.leg_right_cm) : null,
        recorded_date: form.recorded_date || undefined,
      });
      setForm(EMPTY_FORM);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const ok = await confirm('¿Eliminar esta medición?');
    if (!ok) return;
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
            style={{ width: 100 }}
            value={form.height_cm}
            onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))}
          />
          <input
            placeholder={`Peso (${unitLabel(weightUnit)})`}
            style={{ width: 100 }}
            value={form.weight}
            onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
          />
          <input
            placeholder="% grasa"
            style={{ width: 90 }}
            value={form.body_fat_pct}
            onChange={(e) => setForm((f) => ({ ...f, body_fat_pct: e.target.value }))}
          />
          <input
            placeholder="Pecho (cm)"
            style={{ width: 100 }}
            value={form.chest_cm}
            onChange={(e) => setForm((f) => ({ ...f, chest_cm: e.target.value }))}
          />
          <input
            placeholder="Torso/cintura (cm)"
            style={{ width: 130 }}
            value={form.waist_cm}
            onChange={(e) => setForm((f) => ({ ...f, waist_cm: e.target.value }))}
          />
          <input
            placeholder="Brazo izq. (cm)"
            style={{ width: 115 }}
            value={form.arm_left_cm}
            onChange={(e) => setForm((f) => ({ ...f, arm_left_cm: e.target.value }))}
          />
          <input
            placeholder="Brazo der. (cm)"
            style={{ width: 115 }}
            value={form.arm_right_cm}
            onChange={(e) => setForm((f) => ({ ...f, arm_right_cm: e.target.value }))}
          />
          <input
            placeholder="Pierna izq. (cm)"
            style={{ width: 120 }}
            value={form.leg_left_cm}
            onChange={(e) => setForm((f) => ({ ...f, leg_left_cm: e.target.value }))}
          />
          <input
            placeholder="Pierna der. (cm)"
            style={{ width: 120 }}
            value={form.leg_right_cm}
            onChange={(e) => setForm((f) => ({ ...f, leg_right_cm: e.target.value }))}
          />
          <button className="btn-secondary" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Registrar medición'}
          </button>
        </form>
      )}
      {canEdit && (
        <p className="hint-text">Todos los campos son opcionales — llena solo lo que hayas medido ese día.</p>
      )}

      {history.length === 0 ? (
        <p className="muted">Aún no hay mediciones registradas.</p>
      ) : (
        <>
          <Suspense fallback={<p className="muted">Cargando gráfica…</p>}>
            <BodyMetricsChart history={history} weightUnit={weightUnit} />
          </Suspense>
          <div className="day-card">
            <table className="logs-table body-metrics-table">
              <thead>
                <tr>
                  <th>Fecha</th><th>Altura</th><th>Peso</th><th>% Grasa</th>
                  <th>Pecho</th><th>Torso</th>
                  <th>Brazo Izq</th><th>Brazo Der</th><th>Pierna Izq</th><th>Pierna Der</th>
                  {canEdit && <th></th>}
                </tr>
              </thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.recorded_date).toLocaleDateString('es-CO')}</td>
                    <td>{m.height_cm ? `${m.height_cm} cm` : '—'}</td>
                    <td>{m.weight_kg ? `${kgToDisplay(m.weight_kg, weightUnit)} ${unitLabel(weightUnit)}` : '—'}</td>
                    <td>{m.body_fat_pct ? `${m.body_fat_pct}%` : '—'}</td>
                    <td>{m.chest_cm ? `${m.chest_cm} cm` : '—'}</td>
                    <td>{m.waist_cm ? `${m.waist_cm} cm` : '—'}</td>
                    <td>{m.arm_left_cm ? `${m.arm_left_cm} cm` : '—'}</td>
                    <td>{m.arm_right_cm ? `${m.arm_right_cm} cm` : '—'}</td>
                    <td>{m.leg_left_cm ? `${m.leg_left_cm} cm` : '—'}</td>
                    <td>{m.leg_right_cm ? `${m.leg_right_cm} cm` : '—'}</td>
                    {canEdit && (
                      <td><button className="btn-link danger" onClick={() => handleDelete(m.id)}>✕</button></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
