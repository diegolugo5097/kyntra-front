import { useEffect, useState, Fragment } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { kgToDisplay, displayToKg, unitLabel } from '../utils/units.js';
import BodyMetrics from './BodyMetrics.jsx';
import UnitToggle from './UnitToggle.jsx';

export default function RoutineView({ liveEvent, refreshKey }) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const weightUnit = user.weight_unit || 'kg';
  const [days, setDays] = useState([]);
  const [logForms, setLogForms] = useState({}); // exerciseId -> {weight, reps, rir}
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editLogForm, setEditLogForm] = useState({});
  const [media, setMedia] = useState([]);
  const [uploadTarget, setUploadTarget] = useState({ day_id: '', exercise_id: '' });
  const [uploading, setUploading] = useState(false);

  function loadRoutine() {
    api.getRoutine(user.id).then(setDays);
  }
  function loadMedia() {
    api.getMedia(user.id).then(setMedia);
  }

  useEffect(() => {
    loadRoutine();
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    if (liveEvent?.event === 'notification' && liveEvent.data.type === 'new_observation') {
      loadMedia();
    }
  }, [liveEvent]);

  function updateLogForm(exId, field, value) {
    setLogForms((prev) => ({ ...prev, [exId]: { ...prev[exId], [field]: value } }));
  }

  async function submitLog(exId, setNumber) {
    const form = logForms[exId] || {};
    if (!form.weight && !form.reps) return;
    await api.logSet(exId, {
      set_number: setNumber,
      weight_kg: displayToKg(form.weight, weightUnit),
      reps: form.reps ? Number(form.reps) : null,
      rir: form.rir ? Number(form.rir) : null,
    });
    setLogForms((prev) => ({ ...prev, [exId]: {} }));
    if (expandedExercise === exId) {
      const data = await api.getLogs(exId);
      setHistoryLogs(data);
    }
  }

  async function toggleHistory(exerciseId) {
    if (expandedExercise === exerciseId) {
      setExpandedExercise(null);
      return;
    }
    setLoadingLogs(true);
    try {
      const data = await api.getLogs(exerciseId);
      setHistoryLogs(data);
      setExpandedExercise(exerciseId);
    } finally {
      setLoadingLogs(false);
    }
  }

  function startEditLog(log) {
    setEditingLogId(log.id);
    setEditLogForm({
      weight: log.weight_kg ? kgToDisplay(log.weight_kg, weightUnit) : '',
      reps: log.reps ?? '',
      rir: log.rir ?? '',
    });
  }

  async function saveEditLog(logId) {
    await api.updateLog(logId, {
      weight_kg: displayToKg(editLogForm.weight, weightUnit),
      reps: editLogForm.reps ? Number(editLogForm.reps) : null,
      rir: editLogForm.rir ? Number(editLogForm.rir) : null,
    });
    setEditingLogId(null);
    const data = await api.getLogs(expandedExercise);
    setHistoryLogs(data);
  }

  async function deleteLog(logId) {
    const ok = await confirm('¿Eliminar este registro?');
    if (!ok) return;
    await api.deleteLog(logId);
    const data = await api.getLogs(expandedExercise);
    setHistoryLogs(data);
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (uploadTarget.day_id) formData.append('day_id', uploadTarget.day_id);
      if (uploadTarget.exercise_id) formData.append('exercise_id', uploadTarget.exercise_id);
      await api.uploadMedia(formData);
      e.target.reset();
      loadMedia();
    } finally {
      setUploading(false);
    }
  }

  async function removeMedia(mediaId) {
    const ok = await confirm('¿Eliminar esta evidencia? No se puede deshacer.');
    if (!ok) return;
    await api.deleteMedia(mediaId);
    loadMedia();
  }

  return (
    <div className="routine-view">
      <div className="routine-view-head">
        <h2>Tu rutina</h2>
        <div className="unit-toggle-labeled">
          <span className="muted">Registrar peso en:</span>
          <UnitToggle />
        </div>
      </div>
      {days.length === 0 && <p className="muted">Tu entrenador aún no ha creado tu rutina.</p>}

      {days.map((day) => (
        <div key={day.id} className="day-card">
          <h3>{day.name}</h3>
          <table className="exercise-table">
            <thead>
              <tr>
                <th>Ejercicio</th><th>Objetivo</th><th>Registrar serie</th><th>Historial</th>
              </tr>
            </thead>
            <tbody>
              {day.exercises.map((ex) => (
                <Fragment key={ex.id}>
                  <tr>
                    <td>
                      {ex.name}
                      {ex.notes && <div className="ex-note">{ex.notes}</div>}
                    </td>
                    <td>
                      {ex.target_sets ?? '—'}×{ex.target_reps ?? '—'} · RIR {ex.rir ?? '—'} · RPE {ex.rpe ?? '—'}
                      {ex.rest && <div className="ex-note">Descanso: {ex.rest}</div>}
                    </td>
                    <td>
                      <div className="log-row">
                        <input
                          placeholder={unitLabel(weightUnit)}
                          style={{ width: 60 }}
                          value={logForms[ex.id]?.weight || ''}
                          onChange={(e) => updateLogForm(ex.id, 'weight', e.target.value)}
                        />
                        <input
                          placeholder="reps"
                          style={{ width: 60 }}
                          value={logForms[ex.id]?.reps || ''}
                          onChange={(e) => updateLogForm(ex.id, 'reps', e.target.value)}
                        />
                        <button className="btn-secondary" onClick={() => submitLog(ex.id, 1)}>
                          Guardar
                        </button>
                      </div>
                    </td>
                    <td>
                      <button className="btn-link" onClick={() => toggleHistory(ex.id)}>
                        {expandedExercise === ex.id ? 'Ocultar' : 'Ver historial'}
                      </button>
                    </td>
                  </tr>
                  {expandedExercise === ex.id && (
                    <tr>
                      <td colSpan={4}>
                        {loadingLogs && <p className="muted">Cargando…</p>}
                        {!loadingLogs && historyLogs.length === 0 && (
                          <p className="muted">Aún no has registrado series de este ejercicio.</p>
                        )}
                        {!loadingLogs && historyLogs.length > 0 && (
                          <table className="logs-table">
                            <thead>
                              <tr><th>Fecha</th><th>Serie</th><th>Peso ({unitLabel(weightUnit)})</th><th>Reps</th><th>RIR</th><th></th></tr>
                            </thead>
                            <tbody>
                              {historyLogs.map((log) => (
                                <tr key={log.id}>
                                  <td>{new Date(log.log_date).toLocaleDateString('es-CO')}</td>
                                  <td>{log.set_number}</td>
                                  {editingLogId === log.id ? (
                                    <>
                                      <td>
                                        <input
                                          style={{ width: 55 }}
                                          value={editLogForm.weight}
                                          onChange={(e) => setEditLogForm((f) => ({ ...f, weight: e.target.value }))}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          style={{ width: 50 }}
                                          value={editLogForm.reps}
                                          onChange={(e) => setEditLogForm((f) => ({ ...f, reps: e.target.value }))}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          style={{ width: 45 }}
                                          value={editLogForm.rir}
                                          onChange={(e) => setEditLogForm((f) => ({ ...f, rir: e.target.value }))}
                                        />
                                      </td>
                                      <td>
                                        <button className="btn-link" onClick={() => saveEditLog(log.id)}>Guardar</button>{' '}
                                        <button className="btn-link" onClick={() => setEditingLogId(null)}>Cancelar</button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td>{log.weight_kg ? kgToDisplay(log.weight_kg, weightUnit) : '—'}</td>
                                      <td>{log.reps ?? '—'}</td>
                                      <td>{log.rir ?? '—'}</td>
                                      <td>
                                        <button className="btn-link" onClick={() => startEditLog(log)}>Editar</button>{' '}
                                        <button className="btn-link danger" onClick={() => deleteLog(log.id)}>✕</button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <BodyMetrics userId={user.id} canEdit={false} weightUnit={weightUnit} refreshKey={refreshKey} />

      <h3 className="section-title">Subir evidencia</h3>
      <form className="upload-form" onSubmit={handleUpload}>
        <select
          value={uploadTarget.day_id}
          onChange={(e) => setUploadTarget({ day_id: e.target.value, exercise_id: '' })}
        >
          <option value="">(Sin asociar a un día)</option>
          {days.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input type="file" name="file" accept="image/*,video/*" required />
        <button className="btn-primary" type="submit" disabled={uploading}>
          {uploading ? 'Subiendo…' : 'Subir'}
        </button>
      </form>

      <div className="media-grid">
        {media.map((m) => (
          <div key={m.id} className="media-card">
            <div className="media-card-head">
              <span className="media-date">{new Date(m.created_at).toLocaleString('es-CO')}</span>
              <button className="btn-link danger" onClick={() => removeMedia(m.id)}>Eliminar</button>
            </div>
            {m.media_type === 'video' ? <video src={m.url} controls /> : <img src={m.url} alt="Tu evidencia" />}
            {m.observation && (
              <div className="observation">
                <strong>Observación del entrenador:</strong>
                <p>{m.observation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
