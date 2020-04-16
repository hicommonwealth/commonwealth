import app from 'state';

export function notifyError(message: string, allowDuplicates?: boolean) {
  if (!allowDuplicates && app.toasts.getList().find((toast: any) => toast['_message'] === message)) return;
  app.toasts.createError(message);
}

export function notifySuccess(message: string, allowDuplicates?: boolean) {
  if (!allowDuplicates && app.toasts.getList().find((toast: any) => toast['_message'] === message)) return;
  app.toasts.createSuccess(message);
}

export function notifyInfo(message: string, allowDuplicates?: boolean) {
  if (!allowDuplicates && app.toasts.getList().find((toast: any) => toast['_message'] === message)) return;
  app.toasts.createInfo(message);
}
