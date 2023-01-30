import { notifyError, notifySuccess } from 'controllers/app/notifications';
import {getRouteParam} from "mithrilInterop";

const showLoginNotification = () => {
  const loggedIn = getRouteParam('loggedin');
  const loginError = getRouteParam('loginerror');

  if (loggedIn) {
    notifySuccess('Logged in!');
  } else if (loginError) {
    notifyError('Could not log in');
    console.error(getRouteParam('loginerror'));
  }
};

export default showLoginNotification;
