import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { notifyError } from 'controllers/app/notifications';
import app from 'state';
import { userStore } from '../../ui/user';
import { ApiEndpoints } from '../config';

export const updateEmail = async ({ email }: { email: string }) => {
  await axios.post(`${app.serverUrl()}/${ApiEndpoints.UPDATE_USER_EMAIL}`, {
    email: email,
    jwt: userStore.getState().jwt,
  });

  return email;
};

export const onUpdateEmailSuccess = (email: string) =>
  userStore.getState().setData({ email });
export const onUpdateEmailError = (shouldNotifyFailure: boolean) =>
  shouldNotifyFailure && notifyError('Unable to update email');

const useUpdateUserEmailMutation = ({
  shouldNotifyFailure = true,
}: {
  shouldNotifyFailure?: boolean;
}) => {
  return useMutation({
    mutationFn: updateEmail,
    onSuccess: onUpdateEmailSuccess,
    onError: () => onUpdateEmailError(shouldNotifyFailure),
  });
};

export default useUpdateUserEmailMutation;
