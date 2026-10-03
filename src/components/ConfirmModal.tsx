import { useState } from 'react';
import Modal from './Modal';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  /** When set, user must type this exact text to confirm (e.g. "DELETE"). */
  requireText?: string;
}

/** Destructive-action confirmation with optional typed confirmation. */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  requireText,
}: ConfirmModalProps) {
  const [typed, setTyped] = useState('');
  const canConfirm = requireText ? typed.trim() === requireText : true;

  const close = () => {
    setTyped('');
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title={title} maxWidth="max-w-sm">
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
      {requireText && (
        <div className="mt-4">
          <label htmlFor="confirm-text" className="label">
            Type <span className="font-bold text-red-500">{requireText}</span> to confirm
          </label>
          <input
            id="confirm-text"
            className="input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={requireText}
            autoComplete="off"
          />
        </div>
      )}
      <div className="mt-5 flex gap-3">
        <button className="btn-secondary flex-1" onClick={close}>
          Cancel
        </button>
        <button
          className={danger ? 'btn-danger flex-1' : 'btn-primary flex-1'}
          disabled={!canConfirm}
          onClick={() => {
            onConfirm();
            close();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
