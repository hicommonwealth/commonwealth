import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { notifyError } from 'controllers/app/notifications';
import { SERVER_URL } from 'state/api/config';
import {
  EmailNotificationInterval,
  useUserStore,
  userStore,
} from '../../ui/user/user';
import { ApiEndpoints } from '../config';

type UseUpdateUserEmailSettingsProps = {
  emailNotificationInterval?: EmailNotificationInterval;
  promotionalEmailsEnabled?: boolean;
};

const updateUserEmailSettings = async ({
  emailNotificationInterval,
  promotionalEmailsEnabled,
}: UseUpdateUserEmailSettingsProps) => {
  await axios.post(
    `${SERVER_URL}/${ApiEndpoints.UPDATE_USER_EMAIL_INTERVAL_SETTINGS}`,
    {
      jwt: userStore.getState().jwt,
      ...(typeof promotionalEmailsEnabled === 'boolean' && {
        promotional_emails_enabled: promotionalEmailsEnabled,
      }),
      ...(typeof emailNotificationInterval === 'string' && {
        email_notification_interval: emailNotificationInterval,
      }),
    },
  );

  return emailNotificationInterval;
};

const useUpdateUserEmailSettingsMutation = () => {
  const user = useUserStore();

  return useMutation({
    mutationFn: updateUserEmailSettings,
    onSuccess: (emailNotificationInterval) =>
      user.setData({
        emailNotificationInterval: emailNotificationInterval || '',
      }),
    onError: () => notifyError('Unable to set email interval'),
  });
};

export default useUpdateUserEmailSettingsMutation;
