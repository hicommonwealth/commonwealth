// TODO: Remove this file; we can just use app.toasts instead of notifyError now

import app from 'state';

export function notifyError(message: string) {
  app.toasts.createError(message);
}

export function notifySuccess(message: string) {
  app.toasts.createSuccess(message);
}

export function notifyInfo(message: string) {
  app.toasts.createInfo(message);
}
