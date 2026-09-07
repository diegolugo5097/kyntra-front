import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { message, confirmLabel, danger, resolve }

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setState({
        message,
        confirmLabel: options.confirmLabel || 'Eliminar',
        cancelLabel: options.cancelLabel || 'Cancelar',
        danger: options.danger !== false,
        resolve,
      });
    });
  }, []);

  function handleClose(result) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={() => handleClose(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="modal-message">{state.message}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => handleClose(false)}>
                {state.cancelLabel}
              </button>
              <button
                className={state.danger ? 'btn-danger' : 'btn-primary'}
                onClick={() => handleClose(true)}
                autoFocus
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// Uso: const confirm = useConfirm(); const ok = await confirm('¿Seguro?'); if (!ok) return;
export function useConfirm() {
  return useContext(ConfirmContext);
}
