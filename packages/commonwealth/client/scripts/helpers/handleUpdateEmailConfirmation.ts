import { notifySuccess } from 'controllers/app/notifications';
import { _DEPRECATED_getSearchParams } from 'mithrilInterop';

const handleUpdateEmailConfirmation = () => {
  if (_DEPRECATED_getSearchParams('confirmation')) {
    if (_DEPRECATED_getSearchParams('confirmation') === 'success') {
      notifySuccess('Email confirmed!');
    }
  }
};

export default handleUpdateEmailConfirmation;
