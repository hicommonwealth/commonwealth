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
  // TODO: cleanup https://github.com/hicommonwealth/commonwealth/issues/8393
  const key = emailNotificationInterval
    ? 'updateEmailInterval'
    : 'promotional_emails_enabled';
  const value = emailNotificationInterval
    ? emailNotificationInterval
    : `${promotionalEmailsEnabled}`;

  await axios.post(
    `${SERVER_URL}/${ApiEndpoints.UPDATE_USER_EMAIL_INTERVAL_SETTINGS}`,
    {
      jwt: userStore.getState().jwt,
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
