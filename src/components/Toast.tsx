import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0" id="toast-container-div">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transform transition-all duration-300 translate-y-0 opacity-100 ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50/95 border-rose-200 text-rose-800'
              : 'bg-purple-50/95 border-purple-200 text-purple-800'
          }`}
          id={`toast-${toast.id}`}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" id={`toast-icon-success-${toast.id}`} />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" id={`toast-icon-error-${toast.id}`} />
          )}
          {toast.type === 'info' && (
            <AlertCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" id={`toast-icon-info-${toast.id}`} />
          )}

          <div className="flex-1 text-sm font-medium leading-relaxed" id={`toast-text-${toast.id}`}>
            {toast.text}
          </div>

          <button
            onClick={() => onClose(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 mt-0.5"
            id={`toast-close-${toast.id}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
