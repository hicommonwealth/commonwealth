import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import app from 'state';
import { EmailNotificationInterval, useUserStore } from '../../ui/user/user';
import { ApiEndpoints } from '../config';

type UseUpdateUserEmailSettingsProps = {
  emailNotificationInterval?: EmailNotificationInterval;
  promotionalEmailsEnabled?: boolean;
};

export const updateUserEmailSettings = async ({
  emailNotificationInterval,
  promotionalEmailsEnabled,
}: UseUpdateUserEmailSettingsProps) => {
  // TODO: api endpoint for this should be cleaned up
  const key = emailNotificationInterval
    ? 'updateEmailInterval'
    : 'promotional_emails_enabled';
  const value = emailNotificationInterval
    ? emailNotificationInterval
    : `${promotionalEmailsEnabled}`;

  await axios.post(
    `${app.serverUrl()}/${ApiEndpoints.UPDATE_EMAIL_INTERVAL_SETTINGS}`,
    {
      jwt: app.user.jwt,
      key,
      value,
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
