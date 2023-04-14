import { notifyError } from 'controllers/app/notifications';
import { APPLICATION_UPDATE_MESSAGE } from 'helpers/constants';

const handleWindowError = () => {
  // ignore ResizeObserver error: https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
  const resizeObserverLoopErrRe = /^ResizeObserver loop limit exceeded/;
  // replace chunk loading errors with a notification that the app has been updated
  const chunkLoadingErrRe = /^Uncaught SyntaxError: Unexpected token/;

  window.onerror = (errorMsg) => {
    if (
      typeof errorMsg === 'string' &&
      resizeObserverLoopErrRe.test(errorMsg)
    ) {
      return false;
    }

    if (typeof errorMsg === 'string' && chunkLoadingErrRe.test(errorMsg)) {
      window.confirm(APPLICATION_UPDATE_MESSAGE);
      return false;
    }

    notifyError(`${errorMsg}`);
    return false;
  };
};

export default handleWindowError;
