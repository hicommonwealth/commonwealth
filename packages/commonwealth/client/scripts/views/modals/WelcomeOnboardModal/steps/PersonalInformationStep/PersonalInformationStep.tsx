import { DEFAULT_NAME, WalletId } from '@hicommonwealth/shared';
import { APIOrderBy, APIOrderDirection } from 'helpers/constants';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import React, { ChangeEvent, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useFetchProfileByIdQuery,
  useSearchProfilesQuery,
} from 'state/api/profiles';
// eslint-disable-next-line max-len
import { useUpdateSubscriptionPreferencesMutation } from 'state/api/trpc/subscription/useUpdateSubscriptionPreferencesMutation';
import {
  useUpdateUserEmailMutation,
  useUpdateUserEmailSettingsMutation,
  useUpdateUserMutation,
} from 'state/api/user';
import useUserStore from 'state/ui/user';
import { generateUsername } from 'unique-username-generator';
import { useDebounce } from 'usehooks-ts';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWForm,
  CWFormRef,
} from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { z } from 'zod';
import './PersonalInformationStep.scss';
import { personalInformationFormValidation } from './validations';

type PersonalInformationStepProps = {
  onComplete: () => void;
};

const PersonalInformationStep = ({
  onComplete,
}: PersonalInformationStepProps) => {
  const formMethodsRef = useRef<CWFormRef>();
  const { mutateAsync: updateUser, isLoading: isUpdatingProfile } =
    useUpdateUserMutation();
  const [isEmailChangeDisabled, setIsEmailChangeDisabled] = useState(false);

  const [currentUsername, setCurrentUsername] = useState('');
  const debouncedSearchTerm = useDebounce<string>(currentUsername, 500);

  const user = useUserStore();
  const { mutateAsync: updateEmail } = useUpdateUserEmailMutation({});
  const { mutateAsync: updateEmailSettings } =
    useUpdateUserEmailSettingsMutation();
  const { refetch: refetchProfileData } = useFetchProfileByIdQuery({
    apiCallEnabled: true,
  });

  useNecessaryEffect(() => {
    // if user authenticated with SSO, by default we show username granted by the SSO service
    const addresses = user.addresses;
    const defaultSSOUsername =
      addresses?.length === 1 && addresses?.[0]?.walletId === WalletId.Magic
        ? addresses?.[0]?.profile?.name
        : '';

    if (formMethodsRef.current) {
      if (defaultSSOUsername && defaultSSOUsername !== DEFAULT_NAME) {
        formMethodsRef.current.setValue('username', defaultSSOUsername, {
          shouldDirty: true,
        });
        formMethodsRef.current.trigger('username').catch(console.error);
      }

      if (user.email) {
        formMethodsRef.current.setValue('email', user.email, {
          shouldDirty: true,
        });
        formMethodsRef.current.trigger('email').catch(console.error);
        setIsEmailChangeDisabled(true); // we don't allow SSO users to update their email during onboard.
      }
    }
  }, []);

  const { mutateAsync: updateSubscriptionPreferences } =
    useUpdateSubscriptionPreferencesMutation();

  const { data: profiles, isLoading: isCheckingUsernameUniqueness } =
    useSearchProfilesQuery({
      limit: 1000,
      searchTerm: debouncedSearchTerm,
      communityId: 'all_communities',
      orderBy: APIOrderBy.LastActive,
      orderDirection: APIOrderDirection.Desc,
    });

  const existingUsernames = (profiles?.pages?.[0]?.results || []).map(
    (userResult) => userResult?.profile_name?.trim?.().toLowerCase(),
  );
  const isUsernameTaken = existingUsernames.includes(
    currentUsername.toLowerCase(),
  );

  const handleGenerateUsername = () => {
    const randomUsername = generateUsername('', 2);
    // @ts-expect-error <StrictNullChecks/>
    formMethodsRef.current.setValue('username', randomUsername, {
      shouldDirty: true,
    });
    // @ts-expect-error <StrictNullChecks/>
    formMethodsRef.current.trigger('username').catch(console.error);
    setCurrentUsername(randomUsername);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value === '' && formMethodsRef.current) {
      formMethodsRef.current.setValue('enableAccountNotifications', false);
      formMethodsRef.current.setValue('enableProductUpdates', false);
    }
  };

  const handleSubmit = async (
    values: z.infer<typeof personalInformationFormValidation>,
  ) => {
    if (isUsernameTaken || isCheckingUsernameUniqueness) return;

    await updateUser({
      id: user.id,
      promotional_emails_enabled: values.enableProductUpdates,
      profile: {
        name: values.username.trim(),
      },
    });

    // set email for notifications
    if (values.email) {
      await updateEmail({ email: values.email });
    }

    if (values.enableAccountNotifications) {
      await updateSubscriptionPreferences({
        id: user.id,
        email_notifications_enabled: true,
        recap_email_enabled: true,
        digest_email_enabled: true,
      });
    }
    // enable/disable promotional emails flag for user
    await updateEmailSettings({
      promotionalEmailsEnabled: values.enableProductUpdates,
    });

    // refetch profile data
    await refetchProfileData().catch(console.error);

    onComplete();
  };

  return (
    <CWForm
      // @ts-expect-error <StrictNullChecks/>
      ref={formMethodsRef}
      className="PersonalInformationStep"
      validationSchema={personalInformationFormValidation}
      initialValues={{
        enableAccountNotifications: false,
        enableProductUpdates: false,
      }}
      onSubmit={handleSubmit}
    >
      {({ formState, watch }) => (
        <>
          <div className="username-section">
            <CWTextInput
              fullWidth
              placeholder="Enter your user name"
              label={
                <CWText type="h4" fontWeight="semiBold">
                  Enter a username&nbsp;<CWText type="b1">(required)</CWText>
                </CWText>
              }
              name="username"
              hookToForm
              onInput={(e) => setCurrentUsername(e.target.value.trim())}
              customError={
                formState.isDirty &&
                watch('username')?.trim() !== '' &&
                isUsernameTaken
                  ? 'Username already exists'
                  : ''
              }
            />
            <CWButton
              label="Generate random username"
              buttonType="tertiary"
              buttonHeight="sm"
              type="button"
              containerClassName="random-generate-btn"
              onClick={handleGenerateUsername}
            />
          </div>

          <CWTextInput
            fullWidth
            placeholder="Add an email address"
            label={
              <CWText type="h4" fontWeight="semiBold">
                Add an email address&nbsp;<CWText type="b1">(optional)</CWText>
              </CWText>
            }
            name="email"
            hookToForm
            onInput={handleEmailChange}
            disabled={isEmailChangeDisabled}
          />

          <div className="notification-section">
            <CWCheckbox
              name="enableAccountNotifications"
              hookToForm
              label="Send me notifications about my account"
              disabled={watch('email')?.trim() === '' || !formState.isDirty}
            />
            <CWCheckbox
              name="enableProductUpdates"
              hookToForm
              label="Send me product updates and news"
              disabled={watch('email')?.trim() === '' || !formState.isDirty}
            />
          </div>

          <CWButton
            label="Next"
            buttonWidth="full"
            type="submit"
            disabled={
              isUpdatingProfile ||
              isCheckingUsernameUniqueness ||
              !formState.isDirty ||
              watch('username')?.trim() === ''
            }
          />

          <CWText isCentered className="footer">
            We will never share your contact information with third party
            services.
            <br />
            For questions please review our&nbsp;
            <Link to="/privacy">Privacy Policy</Link>
          </CWText>
        </>
      )}
    </CWForm>
  );
};

export { PersonalInformationStep };
