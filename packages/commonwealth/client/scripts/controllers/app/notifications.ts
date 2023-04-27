import { toast } from 'react-toastify';

export function notifySuccess(message: string) {
  toast(message, {
    type: 'success',
    autoClose: 3000,
    position: toast.POSITION.BOTTOM_RIGHT,
  });
}

export function notifyError(message: string) {
  toast(message, {
    type: 'error',
    autoClose: 3000,
    position: toast.POSITION.BOTTOM_RIGHT,
  });
}

export function notifyInfo(message: string) {
  toast(message, {
    type: 'info',
    autoClose: 3000,
    position: toast.POSITION.BOTTOM_RIGHT,
  });
}
