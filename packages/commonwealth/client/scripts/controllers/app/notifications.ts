import app from 'state';
import { toast } from 'react-toastify';

export function notifySuccess(message: string, allowDuplicates?: boolean) {
  toast(message, {
    type: 'success',
    autoClose: 30000,
    position: toast.POSITION.BOTTOM_RIGHT,
  });
}

export function notifyError(message: string, allowDuplicates?: boolean) {
  toast(message, {
    type: 'error',
    autoClose: 3000,
    position: toast.POSITION.BOTTOM_RIGHT,
  });
}

export function notifyInfo(message: string, allowDuplicates?: boolean) {
  toast(message, {
    type: 'info',
    autoClose: 3000,
    position: toast.POSITION.BOTTOM_RIGHT,
  });
}
