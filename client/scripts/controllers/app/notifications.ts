import { default as toastr } from 'toastr';

toastr.options.positionClass = 'toast-bottom-left';
toastr.options.hideDuration = 500;
toastr.options.timeOut = 4000;
toastr.options.escapeHtml = true;

export function notifyError(message: string) {
  toastr.error(message);
}

export function notifySuccess(message: string) {
  toastr.success(message);
}

export function notifyWarning(message: string) {
  toastr.warning(message);
}

export function notifyInfo(message: string) {
  toastr.info(message);
}
