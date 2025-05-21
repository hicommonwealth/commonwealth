import axios from 'axios';
import { notifyError } from 'controllers/app/notifications';
import { trpc } from 'utils/trpcClient';
import { userStore } from '../../ui/user';
import { SERVER_URL } from '../config';

const useUpdateUserEmailMutation = ({
  shouldNotifyFailure = true,
}: {
  shouldNotifyFailure?: boolean;
}) => {
  return trpc.user.updateEmail.useMutation({
    onSuccess: ({ email }) => userStore.getState().setData({ email }),
    onError: () => shouldNotifyFailure && notifyError('Unable to update email'),
  });
};

export default useUpdateUserEmailMutation;

export const updateEmail = ({ email }: { email: string }) =>
  axios
    .post(
      `${SERVER_URL}/internal/UpdateEmail`,
      { email, jwt: userStore.getState().jwt },
      {
        headers: {
          'Content-Type': 'application/json',
          address: userStore.getState().activeAccount?.address,
        },
      },
    )
    .then(() => userStore.getState().setData({ email }))
    .catch(() => {});
