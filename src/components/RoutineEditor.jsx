import { useEffect, useState, Fragment } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { kgToDisplay, unitLabel } from '../utils/units.js';
import BodyMetrics from './BodyMetrics.jsx';

export default function RoutineEditor({ selectedUser, liveEvent, refreshKey }) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const weightUnit = user.weight_unit || 'kg';
  const [days, setDays] = useState([]);
  const [newDayName, setNewDayName] = useState('');
  const [media, setMedia] = useState([]);
  const [exerciseForms, setExerciseForms] = useState({}); // dayId -> form state
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editExerciseForm, setEditExerciseForm] = useState({});

  async function toggleLogs(exerciseId) {
    if (expandedExercise === exerciseId) {
      setExpandedExercise(null);
      return;
    }
    setLoadingLogs(true);
    try {
      const data = await api.getLogs(exerciseId);
      setLogs(data);
      setExpandedExercise(exerciseId);
    } finally {
      setLoadingLogs(false);
    }
  }

  function loadRoutine() {
    if (!selectedUser) return;
    api.getRoutine(selectedUser.id).then(setDays);
  }
  function loadMedia() {
    if (!selectedUser) return;
    api.getMedia(selectedUser.id).then(setMedia);
  }

  useEffect(() => {
    loadRoutine();
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.id, refreshKey]);

  useEffect(() => {
    if (liveEvent?.event === 'notification' && liveEvent.data.type === 'new_upload') {
      loadMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveEvent]);

  async function addDay(e) {
    e.preventDefault();
    if (!newDayName.trim()) return;
    await api.createDay(selectedUser.id, newDayName.trim(), days.length);
    setNewDayName('');
    loadRoutine();
  }

  async function removeDay(dayId, dayName) {
    const ok = await confirm(`¿Eliminar el día "${dayName}" y todos sus ejercicios? No se puede deshacer.`);
    if (!ok) return;
    await api.deleteDay(dayId);
    loadRoutine();
  }

  function updateExerciseForm(dayId, field, value) {
    setExerciseForms((prev) => ({ ...prev, [dayId]: { ...prev[dayId], [field]: value } }));
  }

  async function addExercise(dayId) {
    const form = exerciseForms[dayId] || {};
    if (!form.name?.trim()) return;
    await api.createExercise(dayId, {
      name: form.name.trim(),
      target_sets: form.target_sets ? Number(form.target_sets) : null,
      target_reps: form.target_reps || null,
      rir: form.rir ? Number(form.rir) : null,
      rpe: form.rpe || null,
      rest: form.rest || null,
      notes: form.notes || null,
    });
    setExerciseForms((prev) => ({ ...prev, [dayId]: {} }));
    loadRoutine();
  }

  async function removeExercise(exerciseId, exerciseName) {
    const ok = await confirm(`¿Eliminar el ejercicio "${exerciseName}"? Se borrará también su historial de series. No se puede deshacer.`);
    if (!ok) return;
    await api.deleteExercise(exerciseId);
    loadRoutine();
  }

  function startEditExercise(ex) {
    setEditingExerciseId(ex.id);
    setEditExerciseForm({
      name: ex.name || '',
      target_sets: ex.target_sets ?? '',
      target_reps: ex.target_reps || '',
      rir: ex.rir ?? '',
      rpe: ex.rpe || '',
      rest: ex.rest || '',
      notes: ex.notes || '',
    });
  }

  function updateEditExerciseForm(field, value) {
    setEditExerciseForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveEditExercise(exerciseId) {
    const form = editExerciseForm;
    if (!form.name?.trim()) return;
    await api.updateExercise(exerciseId, {
      name: form.name.trim(),
      target_sets: form.target_sets ? Number(form.target_sets) : null,
      target_reps: form.target_reps || null,
      rir: form.rir ? Number(form.rir) : null,
      rpe: form.rpe || null,
      rest: form.rest || null,
      notes: form.notes || null,
    });
    setEditingExerciseId(null);
    loadRoutine();
  }

  async function saveObservation(mediaId, value) {
    await api.setObservation(mediaId, value);
    loadMedia();
  }

  async function removeMedia(mediaId) {
    const ok = await confirm('¿Eliminar esta evidencia? No se puede deshacer.');
    if (!ok) return;
    await api.deleteMedia(mediaId);
    loadMedia();
  }

  if (!selectedUser) return <p className="muted">Selecciona un usuario de la lista.</p>;

  return (
    <div className="routine-editor">
      <h2>Rutina de {selectedUser.name}</h2>

      <form className="inline-form" onSubmit={addDay}>
        <input
          placeholder='Nuevo día (ej: "TORSO A", "Push")'
          value={newDayName}
          onChange={(e) => setNewDayName(e.target.value)}
        />
        <button className="btn-secondary" type="submit">Agregar día</button>
      </form>

      {days.map((day) => (
        <div key={day.id} className="day-card">
          <div className="day-card-head">
            <h3>{day.name}</h3>
            <button className="btn-link danger" onClick={() => removeDay(day.id, day.name)}>Eliminar día</button>
          </div>

          <table className="exercise-table">
            <thead>
              <tr>
                <th>Ejercicio</th><th>Series</th><th>Reps</th><th>RIR</th><th>RPE</th><th>Descanso</th><th>Progreso</th><th></th>
              </tr>
            </thead>
            <tbody>
              {day.exercises.map((ex) => (
                <Fragment key={ex.id}>
                  <tr>
                    {editingExerciseId === ex.id ? (
                      <>
                        <td>
                          <input
                            style={{ width: 130 }}
                            value={editExerciseForm.name}
                            onChange={(e) => updateEditExerciseForm('name', e.target.value)}
                          />
                          <input
                            style={{ width: 130, marginTop: 4, display: 'block' }}
                            placeholder="Indicaciones"
                            value={editExerciseForm.notes}
                            onChange={(e) => updateEditExerciseForm('notes', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            style={{ width: 55 }}
                            value={editExerciseForm.target_sets}
                            onChange={(e) => updateEditExerciseForm('target_sets', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            style={{ width: 65 }}
                            value={editExerciseForm.target_reps}
                            onChange={(e) => updateEditExerciseForm('target_reps', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            style={{ width: 45 }}
                            value={editExerciseForm.rir}
                            onChange={(e) => updateEditExerciseForm('rir', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            style={{ width: 55 }}
                            value={editExerciseForm.rpe}
                            onChange={(e) => updateEditExerciseForm('rpe', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            style={{ width: 80 }}
                            value={editExerciseForm.rest}
                            onChange={(e) => updateEditExerciseForm('rest', e.target.value)}
                          />
                        </td>
                        <td colSpan={2}>
                          <button className="btn-link" onClick={() => saveEditExercise(ex.id)}>Guardar</button>{' '}
                          <button className="btn-link" onClick={() => setEditingExerciseId(null)}>Cancelar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          {ex.name}
                          {ex.notes && <div className="ex-note">{ex.notes}</div>}
                        </td>
                        <td>{ex.target_sets ?? '—'}</td>
                        <td>{ex.target_reps ?? '—'}</td>
                        <td>{ex.rir ?? '—'}</td>
                        <td>{ex.rpe ?? '—'}</td>
                        <td>{ex.rest ?? '—'}</td>
                        <td>
                          <button className="btn-link" onClick={() => toggleLogs(ex.id)}>
                            {expandedExercise === ex.id ? 'Ocultar' : 'Ver registros'}
                          </button>
                        </td>
                        <td>
                          <button className="btn-link" onClick={() => startEditExercise(ex)}>Editar</button>{' '}
                          <button className="btn-link danger" onClick={() => removeExercise(ex.id, ex.name)}>✕</button>
                        </td>
                      </>
                    )}
                  </tr>
                  {expandedExercise === ex.id && (
                    <tr>
                      <td colSpan={8}>
                        {loadingLogs && <p className="muted">Cargando…</p>}
                        {!loadingLogs && logs.length === 0 && (
                          <p className="muted">{selectedUser.name} aún no ha registrado series de este ejercicio.</p>
                        )}
                        {!loadingLogs && logs.length > 0 && (
                          <table className="logs-table">
                            <thead>
                              <tr><th>Fecha</th><th>Serie</th><th>Peso ({unitLabel(weightUnit)})</th><th>Reps</th><th>RIR</th></tr>
                            </thead>
                            <tbody>
                              {logs.map((log) => (
                                <tr key={log.id}>
                                  <td>{new Date(log.log_date).toLocaleDateString('es-CO')}</td>
                                  <td>{log.set_number}</td>
                                  <td>{log.weight_kg ? kgToDisplay(log.weight_kg, weightUnit) : '—'}</td>
                                  <td>{log.reps ?? '—'}</td>
                                  <td>{log.rir ?? '—'}</td>
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

          <div className="add-exercise-row">
            <input
              placeholder="Nombre del ejercicio"
              value={exerciseForms[day.id]?.name || ''}
              onChange={(e) => updateExerciseForm(day.id, 'name', e.target.value)}
            />
            <input
              placeholder="Series"
              style={{ width: 70 }}
              value={exerciseForms[day.id]?.target_sets || ''}
              onChange={(e) => updateExerciseForm(day.id, 'target_sets', e.target.value)}
            />
            <input
              placeholder="Reps (6-8)"
              style={{ width: 90 }}
              value={exerciseForms[day.id]?.target_reps || ''}
              onChange={(e) => updateExerciseForm(day.id, 'target_reps', e.target.value)}
            />
            <input
              placeholder="RIR"
              style={{ width: 60 }}
              value={exerciseForms[day.id]?.rir || ''}
              onChange={(e) => updateExerciseForm(day.id, 'rir', e.target.value)}
            />
            <input
              placeholder="RPE (8-9)"
              style={{ width: 80 }}
              value={exerciseForms[day.id]?.rpe || ''}
              onChange={(e) => updateExerciseForm(day.id, 'rpe', e.target.value)}
            />
            <input
              placeholder="Descanso (60-90s)"
              style={{ width: 130 }}
              value={exerciseForms[day.id]?.rest || ''}
              onChange={(e) => updateExerciseForm(day.id, 'rest', e.target.value)}
            />
            <input
              placeholder="Indicaciones (opcional)"
              value={exerciseForms[day.id]?.notes || ''}
              onChange={(e) => updateExerciseForm(day.id, 'notes', e.target.value)}
            />
            <button className="btn-secondary" onClick={() => addExercise(day.id)}>+ Ejercicio</button>
          </div>
        </div>
      ))}

      <BodyMetrics userId={selectedUser.id} canEdit weightUnit={weightUnit} refreshKey={refreshKey} />

      <h3 className="section-title">Evidencia subida</h3>
      {media.length === 0 && <p className="muted">Aún no hay fotos o videos.</p>}
      <div className="media-grid">
        {media.map((m) => (
          <div key={m.id} className="media-card">
            <div className="media-card-head">
              <span className="media-date">{new Date(m.created_at).toLocaleString('es-CO')}</span>
              <button className="btn-link danger" onClick={() => removeMedia(m.id)}>Eliminar</button>
            </div>
            {m.media_type === 'video' ? (
              <video src={m.url} controls />
            ) : (
              <img src={m.url} alt="Evidencia de rutina" />
            )}
            <textarea
              placeholder="Deja una observación…"
              defaultValue={m.observation || ''}
              onBlur={(e) => {
                if (e.target.value !== (m.observation || '')) saveObservation(m.id, e.target.value);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
