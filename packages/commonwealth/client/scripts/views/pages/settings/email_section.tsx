/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'pages/settings/email_section.scss';

import app from 'state';
import { SocialAccount } from 'models';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { WalletId } from 'common-common/src/types';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWText } from '../../components/component_kit/cw_text';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { getClasses } from '../../components/component_kit/helpers';

export class EmailSection implements m.ClassComponent {
  private discordAccount: SocialAccount;
  private email: string;
  private emailInputUpdated: boolean;
  private emailVerified: boolean;
  private errorMessage: string;
  private githubAccount: SocialAccount;
  private verificationSent: boolean;

  oninit() {
    this.email = app.user.email;
    this.emailInputUpdated = false;
    this.verificationSent = false;
    this.emailVerified = app.user.emailVerified;
    this.githubAccount = app.user.socialAccounts.find(
      (sa) => sa.provider === 'github'
    );
    this.discordAccount = app.user.socialAccounts.find(
      (sa) => sa.provider === 'discord'
    );
    this.errorMessage = null;
  }

  view() {
    const {
      githubAccount,
      discordAccount,
      emailInputUpdated,
      emailVerified,
      verificationSent,
      errorMessage,
    } = this;

    return (
      <div class="EmailSection">
        <div class="login-container">
          <CWText type="h5" fontWeight="semiBold">
            Login
          </CWText>
          <CWTextInput
            placeholder="name@example.com"
            defaultValue={app.user.email || null}
            oninput={(e) => {
              this.emailInputUpdated = true;
              this.verificationSent = false;
              this.email = (e.target as any).value;
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
              onclick={async () => {
                this.errorMessage = null;

                const confirmed = await confirmationModalWithText(
                  'You will be required to confirm your new email address. Continue?'
                )();

                if (!confirmed) return;

                try {
                  this.emailVerified = false;

                  this.verificationSent = true;

                  this.errorMessage = null;

                  m.redraw();
                } catch (err) {
                  this.errorMessage = err.responseJSON.error;

                  m.redraw();

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
            <div class="verification-row">
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
        <div class="link-sites-container">
          <CWText type="h5" fontWeight="semiBold">
            Link other sites
          </CWText>
          <CWButton
            label={githubAccount ? 'Unlink Github' : 'Link Github'}
            buttonType={githubAccount ? 'primary-red' : 'primary-blue'}
            onclick={() => {
              if (githubAccount) {
                $.ajax({
                  url: `${app.serverUrl()}/githubAccount`,
                  data: { jwt: app.user.jwt },
                  type: 'DELETE',
                  success: () => {
                    this.githubAccount = null;
                    m.redraw();
                  },
                  error: (err) => {
                    console.dir(err);
                    m.redraw();
                  },
                });
              } else {
                localStorage.setItem(
                  'githubPostAuthRedirect',
                  JSON.stringify({
                    timestamp: (+new Date()).toString(),
                    path: m.route.get(),
                  })
                );
                document.location = `${app.serverUrl()}/auth/github` as any;
                m.redraw();
              }
            }}
          />
          <CWButton
            label={discordAccount ? 'Unlink Discord' : 'Link Discord'}
            buttonType={discordAccount ? 'primary-red' : 'primary-blue'}
            onclick={() => {
              if (discordAccount) {
                $.ajax({
                  url: `${app.serverUrl()}/discordAccount`,
                  data: { jwt: app.user.jwt },
                  type: 'DELETE',
                  success: () => {
                    this.discordAccount = null;
                    m.redraw();
                  },
                  error: (err) => {
                    console.dir(err);
                    m.redraw();
                  },
                });
              } else {
                localStorage.setItem(
                  'discordPostAuthRedirect',
                  JSON.stringify({
                    timestamp: (+new Date()).toString(),
                    path: m.route.get(),
                  })
                );
                document.location = `${app.serverUrl()}/auth/discord` as any;
                m.redraw();
              }
            }}
          />
        </div>
      </div>
    );
  }
}
