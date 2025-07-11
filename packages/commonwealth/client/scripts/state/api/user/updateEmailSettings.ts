import { notifyError } from 'controllers/app/notifications';
import { trpc } from 'utils/trpcClient';
import { useUserStore } from '../../ui/user/user';

const useUpdateUserEmailSettingsMutation = () => {
  const user = useUserStore();

  return trpc.user.updateSettings.useMutation({
    onSuccess: (_, { email_interval }) =>
      user.setData({ emailNotificationInterval: email_interval || '' }),
    onError: () => notifyError('Unable to set email interval'),
  });
};

export default useUpdateUserEmailSettingsMutation;
