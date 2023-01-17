import m from 'mithril';
import { notifySuccess } from 'controllers/app/notifications';

const handleUpdateEmailConfirmation = () => {
  if (m.route.param('confirmation')) {
    if (m.route.param('confirmation') === 'success') {
      notifySuccess('Email confirmed!');
    }
  }
};

export default handleUpdateEmailConfirmation;
