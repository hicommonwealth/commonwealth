import m from 'mithril';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

const showLoginNotification = () => {
  const loggedIn = m.route.param('loggedin');
  const loginError = m.route.param('loginerror');

  if (loggedIn) {
    notifySuccess('Logged in!');
  } else if (loginError) {
    notifyError('Could not log in');
    console.error(loginError);
  }
};

export default showLoginNotification;
