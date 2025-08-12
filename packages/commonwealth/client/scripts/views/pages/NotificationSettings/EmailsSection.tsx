import {
  EmailNotificationInterval,
  SubscriptionPreference,
} from '@hicommonwealth/schemas';
import React, { useCallback, useMemo, useState } from 'react';
import { useSubscriptionPreferences } from 'state/api/trpc/subscription/useSubscriptionPreferences';
import { useUpdateSubscriptionPreferencesMutation } from 'state/api/trpc/subscription/useUpdateSubscriptionPreferencesMutation';
import useUpdateUserEmailMutation from 'state/api/user/updateEmail';
import useUpdateUserEmailSettingsMutation from 'state/api/user/updateEmailSettings';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { z } from 'zod';

export const EmailsSection = () => {
  const user = useUserStore();
  const { mutateAsync: updateEmail, isPending: isUpdatingEmail } =
    useUpdateUserEmailMutation({});
  const { mutateAsync: updateEmailSettings, isPending: isUpdatingSettings } =
    useUpdateUserEmailSettingsMutation();
  const subscriptionPreferences = useSubscriptionPreferences();
  const {
    mutateAsync: updateSubscriptionPreferences,
    isPending: isUpdatingPrefs,
  } = useUpdateSubscriptionPreferencesMutation();

  const [emailValue, setEmailValue] = useState(user.email || '');
  const [isEmailDirty, setIsEmailDirty] = useState(false);

  const isEmailVerified = user.isEmailVerified;
  const isEmailDisabled = isEmailVerified;

  const handleEmailChange = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setEmailValue(value);
    setIsEmailDirty(value !== user.email);
  };

  const handleUpdateEmail = async () => {
    if (!isEmailDirty || !emailValue.trim()) return;
    try {
      await updateEmail({ email: emailValue.trim() });
      setIsEmailDirty(false);
    } catch (error) {
      // handled by hook
    }
  };

  // Narrow subscription preferences data type for safe property access
  const prefs =
    (subscriptionPreferences.data as
      | Partial<z.infer<typeof SubscriptionPreference>>
      | undefined) || undefined;
  const recapEnabled = !!prefs?.recap_email_enabled;
  const digestEnabled = !!prefs?.digest_email_enabled;

  const handleToggle = useCallback(
    async (
      key: 'recap_email_enabled' | 'digest_email_enabled',
      next: boolean,
    ) => {
      const other =
        key === 'recap_email_enabled' ? digestEnabled : recapEnabled;
      // Keep master email_notifications_enabled in sync: on if any email type is on
      const emailNotificationsEnabled = next || other;
      await updateSubscriptionPreferences({
        id: user.id,
        [key]: next,
        email_notifications_enabled: emailNotificationsEnabled,
      } as any);
      await subscriptionPreferences.refetch();
    },
    [
      digestEnabled,
      recapEnabled,
      subscriptionPreferences,
      updateSubscriptionPreferences,
      user.id,
    ],
  );

  const emailFrequencyOptions = useMemo(
    () =>
      EmailNotificationInterval.options.map((value) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
      })),
    [],
  );

  const currentEmailInterval = user.emailNotificationInterval || 'never';

  const handleFrequencyChange = async (option: {
    value: z.infer<typeof EmailNotificationInterval>;
    label: string;
  }) => {
    try {
      await updateEmailSettings({ email_interval: option.value });
    } catch (error) {
      console.error('Failed to update email frequency:', error);
    }
  };

  return (
    <div className="EmailsSection">
      {/* Top grey card: Email address */}
      <div className="email-card">
        <div className="email-card-header">
          <CWText type="h4">Email address</CWText>
          <CWText className="text-muted">
            Update your email address for notifications and account management
          </CWText>
        </div>
        <div className="email-card-body">
          {isEmailVerified ? (
            <CWTooltip
              content="Verified emails used to sign-in cannot be updated"
              placement="top"
              renderTrigger={(handleInteraction) => (
                <div
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                  className="email-row"
                >
                  <CWTextInput
                    fullWidth
                    placeholder="Enter your email address"
                    value={emailValue}
                    onInput={handleEmailChange}
                    disabled={isEmailDisabled}
                    readOnly={isEmailDisabled}
                  />
                  <CWButton
                    label="Update Email"
                    buttonType="primary"
                    buttonHeight="sm"
                    type="button"
                    disabled={
                      !isEmailDirty ||
                      isEmailDisabled ||
                      isUpdatingEmail ||
                      !emailValue.trim()
                    }
                    onClick={handleUpdateEmail}
                  />
                </div>
              )}
            />
          ) : (
            <div className="email-row">
              <CWTextInput
                fullWidth
                placeholder="Enter your email address"
                value={emailValue}
                onInput={handleEmailChange}
                disabled={isEmailDisabled}
                readOnly={isEmailDisabled}
              />
              <CWButton
                label="Update Email"
                buttonType="primary"
                buttonHeight="sm"
                type="button"
                disabled={
                  !isEmailDirty ||
                  isEmailDisabled ||
                  isUpdatingEmail ||
                  !emailValue.trim()
                }
                onClick={handleUpdateEmail}
              />
            </div>
          )}
        </div>
      </div>

      {/* Separate top section: Email Frequency */}
      <div className="setting-container top-frequency">
        <div className="setting-container-left">
          <CWText type="h4">Email Frequency</CWText>
          <CWText className="text-muted">
            Applies to both Recap and Digest emails
          </CWText>
        </div>
        <div className="setting-container-right">
          <CWSelectList
            options={emailFrequencyOptions}
            value={emailFrequencyOptions.find(
              (o) => o.value === currentEmailInterval,
            )}
            onChange={(opt: any) => handleFrequencyChange(opt)}
            isDisabled={isUpdatingSettings}
          />
        </div>
      </div>

      {/* Toggle list beneath */}
      <div className="toggle-list">
        <div className="setting-container">
          <div className="setting-container-left">
            <CWText type="h4">Recap Emails</CWText>
            <CWText className="text-muted">
              A summary of recent in-app notifications
            </CWText>
          </div>
          <div className="setting-container-right">
            <CWToggle
              checked={!!recapEnabled}
              onChange={() =>
                handleToggle('recap_email_enabled', !recapEnabled)
              }
              disabled={isUpdatingPrefs}
            />
          </div>
        </div>

        <div className="setting-container">
          <div className="setting-container-left">
            <CWText type="h4">Digest Emails</CWText>
            <CWText className="text-muted">
              A summary of the top posts in your communities
            </CWText>
          </div>
          <div className="setting-container-right">
            <CWToggle
              checked={!!digestEnabled}
              onChange={() =>
                handleToggle('digest_email_enabled', !digestEnabled)
              }
              disabled={isUpdatingPrefs}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailsSection;
