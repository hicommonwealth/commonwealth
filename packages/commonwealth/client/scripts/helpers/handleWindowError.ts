import { alertModalWithText } from 'views/modals/alert_modal';
import {
  APPLICATION_UPDATE_ACTION,
  APPLICATION_UPDATE_MESSAGE,
} from 'helpers/constants';
import { notifyError } from 'controllers/app/notifications';

const handleWindowError = () => {
  // ignore ResizeObserver error: https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
  const resizeObserverLoopErrRe = /^ResizeObserver loop limit exceeded/;
  // replace chunk loading errors with a notification that the app has been updated
  const chunkLoadingErrRe = /^Uncaught SyntaxError: Unexpected token/;

  window.onerror = (errorMsg) => {
    if (typeof errorMsg === 'string') {
      if (resizeObserverLoopErrRe.test(errorMsg)) {
        return false;
      }

      if (chunkLoadingErrRe.test(errorMsg)) {
        alertModalWithText(
          APPLICATION_UPDATE_MESSAGE,
          APPLICATION_UPDATE_ACTION
        )();
        return false;
      }
    }

    notifyError(`${errorMsg}`);
    return false;
  };
};

export default handleWindowError;
