import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import app from 'state';

type UseUpdateUserEmailSettingsProps = {
  emailInterval?: 'weekly' | 'never';
  promotionalEmailsEnabled?: boolean;
};

export const updateUserEmailSettings = async ({
  emailInterval,
  promotionalEmailsEnabled,
}: UseUpdateUserEmailSettingsProps) => {
  // TODO: api endpoint for this should be cleaned up
  const key = emailInterval
    ? 'updateEmailInterval'
    : 'promotional_emails_enabled';
  const value = emailInterval ? emailInterval : `${promotionalEmailsEnabled}`;

  await axios.post(`${app.serverUrl()}/writeUserSetting`, {
    jwt: app.user.jwt,
    key,
    value,
  });

  return emailInterval;
};

const useUpdateUserEmailSettingsMutation = () => {
  return useMutation({
    mutationFn: updateUserEmailSettings,
    onSuccess: (emailInterval) =>
      app.user.setEmailInterval(emailInterval || ''),
    onError: () => notifyError('Unable to set email interval'),
  });
};

export default useUpdateUserEmailSettingsMutation;
