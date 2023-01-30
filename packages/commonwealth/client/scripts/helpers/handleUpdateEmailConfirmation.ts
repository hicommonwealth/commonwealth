import { notifySuccess } from 'controllers/app/notifications';
import {getRouteParam} from "mithrilInterop";

const handleUpdateEmailConfirmation = () => {
  if (getRouteParam('confirmation')) {
    if (getRouteParam('confirmation') === 'success') {
      notifySuccess('Email confirmed!');
    }
  }
};

export default handleUpdateEmailConfirmation;
