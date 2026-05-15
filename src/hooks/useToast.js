import toast from '../utils/toast';

export const useToast = () => {
  const addToast = (message, type = 'success', duration = 3000) => {
    const options = duration > 0 ? { duration } : {};
    const method = toast[type] || toast;
    return method(message, options);
  };

  const removeToast = (id) => toast.dismiss(id);

  const success = (message, duration = 3000) => addToast(message, 'success', duration);
  const error = (message, duration = 4000) => addToast(message, 'error', duration);
  const info = (message, duration = 3000) => addToast(message, 'info', duration);
  const warning = (message, duration = 3000) => addToast(message, 'warning', duration);

  return {
    toasts: [],
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
};
