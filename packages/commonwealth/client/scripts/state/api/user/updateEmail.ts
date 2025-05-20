import { notifyError } from 'controllers/app/notifications';
import { trpc } from 'utils/trpcClient';
import { userStore } from '../../ui/user';

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
