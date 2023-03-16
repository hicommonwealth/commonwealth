import React, { useState } from 'react';
import $ from 'jquery';

import { _DEPRECATED_getRoute } from 'mithrilInterop';

import type { SocialAccount } from 'models';

import 'pages/settings/email_section.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { getClasses } from '../../components/component_kit/helpers';
import { WalletId } from 'common-common/src/types';

export const EmailSection = () => {
  const [discordAccount, setDiscordAccount] = useState<SocialAccount>(
    app.user.socialAccounts.find((sa) => sa.provider === 'discord')
  );
  const [email, setEmail] = useState(app.user.email);
  const [emailInputUpdated, setEmailInputUpdated] = useState(false);
  const [emailVerified, setEmailVerified] = useState(app.user.emailVerified);
  const [errorMessage, setErrorMessage] = useState(null);
  const [githubAccount, setGithubAccount] = useState<SocialAccount>(
    app.user.socialAccounts.find((sa) => sa.provider === 'github')
  );
  const [verificationSent, setVerificationSent] = useState(false);

  return (
    <div className="EmailSection">
      <div className="login-container">
        <CWText type="h5" fontWeight="semiBold">
          Login
        </CWText>
        <CWTextInput
          placeholder="name@example.com"
          value={email || null}
          onInput={(e) => {
            setEmailInputUpdated(true);
            setVerificationSent(false);
            setEmail((e.target as any).value);
          }}
        />
        {(!app.user.email || emailInputUpdated || !emailVerified) && (
          <CWButton
            label={
              app.user.email && !emailInputUpdated && !emailVerified
                ? 'Retry verification'
                : 'Update email'
            }
            disabled={
              (!emailInputUpdated && emailVerified) ||
              verificationSent ||
              app.user.addresses.some((a) => a.walletId === WalletId.Magic)
            }
            onClick={async () => {
              setErrorMessage(null);

              const confirmed = window.confirm(
                'You will be required to confirm your new email address. Continue?'
              );

              if (!confirmed) return;

              try {
                await $.post(`${app.serverUrl()}/updateEmail`, {
                  email: email,
                  jwt: app.user.jwt,
                });

                setEmailVerified(false);

                setVerificationSent(true);

                setErrorMessage(null);
              } catch (err) {
                setErrorMessage(err.responseJSON.error);

                throw new Error(
                  err.responseJSON && err.responseJSON.error
                    ? err.responseJSON.error
                    : 'Failed to update email'
                );
              }
            }}
          />
        )}
        {verificationSent ? (
          <CWText>Check your email for a confirmation link</CWText>
        ) : (
          <div className="verification-row">
            <CWIcon
              iconName={emailVerified ? 'check' : 'cautionCircle'}
              className="verification-icon"
            />
            <CWText
              className={getClasses<{ emailVerified?: boolean }>(
                { emailVerified },
                'verification-text'
              )}
            >
              {emailVerified
                ? 'Verified'
                : app.user.email
                ? 'Not verified'
                : 'No email'}
            </CWText>
          </div>
        )}
        {errorMessage && (
          <CWValidationText message={errorMessage} status="failure" />
        )}
      </div>
      <div className="link-sites-container">
        <CWText type="h5" fontWeight="semiBold">
          Link other sites
        </CWText>
        <CWButton
          label={githubAccount ? 'Unlink Github' : 'Link Github'}
          buttonType={githubAccount ? 'primary-red' : 'primary-blue'}
          onClick={() => {
            if (githubAccount) {
              $.ajax({
                url: `${app.serverUrl()}/githubAccount`,
                data: { jwt: app.user.jwt },
                type: 'DELETE',
                success: () => {
                  setGithubAccount(null);
                },
                error: (err) => {
                  console.dir(err);
                },
              });
            } else {
              localStorage.setItem(
                'githubPostAuthRedirect',
                JSON.stringify({
                  timestamp: (+new Date()).toString(),
                  path: _DEPRECATED_getRoute(),
                })
              );
              document.location = `${app.serverUrl()}/auth/github` as any;
            }
          }}
        />
        <CWButton
          label={discordAccount ? 'Unlink Discord' : 'Link Discord'}
          buttonType={discordAccount ? 'primary-red' : 'primary-blue'}
          onClick={() => {
            if (discordAccount) {
              $.ajax({
                url: `${app.serverUrl()}/discordAccount`,
                data: { jwt: app.user.jwt },
                type: 'DELETE',
                success: () => {
                  setDiscordAccount(null);
                },
                error: (err) => {
                  console.dir(err);
                },
              });
            } else {
              localStorage.setItem(
                'discordPostAuthRedirect',
                JSON.stringify({
                  timestamp: (+new Date()).toString(),
                  path: _DEPRECATED_getRoute(),
                })
              );
              document.location = `${app.serverUrl()}/auth/discord` as any;
            }
          }}
        />
      </div>
    </div>
  );
};
