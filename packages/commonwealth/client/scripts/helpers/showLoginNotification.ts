import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { _DEPRECATED_getSearchParams } from 'mithrilInterop';

const showLoginNotification = () => {
  const loggedIn = _DEPRECATED_getSearchParams('loggedin');
  const loginError = _DEPRECATED_getSearchParams('loginerror');

  if (loggedIn) {
    notifySuccess('Logged in!');
  } else if (loginError) {
    notifyError('Could not log in');
    console.error(_DEPRECATED_getSearchParams('loginerror'));
  }
};

export default showLoginNotification;
