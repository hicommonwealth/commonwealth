/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { Button, Colors, Input, Icons, Icon } from 'construct-ui';

import 'pages/settings/email_well.scss';

import { SocialAccount } from 'models';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { WalletId } from 'common-common/src/types';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWText } from '../../components/component_kit/cw_text';

export class EmailWell implements m.ClassComponent {
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

    return [
      m('.EmailWell', [
        <CWText type="h5" fontWeight="semiBold">
          Login
        </CWText>,
        <CWTextInput
          placeholder="name@example.com"
          iconRight="mail"
          defaultValue={app.user.email || null}
          oninput={(e) => {
            this.emailInputUpdated = true;
            this.verificationSent = false;
            this.email = (e.target as any).value;
          }}
        />,
        (!app.user.email || emailInputUpdated || !emailVerified) && (
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

                console.log('Failed to update email');

                throw new Error(
                  err.responseJSON && err.responseJSON.error
                    ? err.responseJSON.error
                    : 'Failed to update email'
                );
              }
            }}
          />
        ),
        verificationSent
          ? m(
              'label',
              {
                style: {
                  color: Colors.GREEN500,
                  position: 'relative',
                  top: '2px',
                },
              },
              'Check your email for a confirmation link'
            )
          : [
              m(Icon, {
                size: 'lg',
                intent: emailVerified ? 'positive' : 'warning',
                name: emailVerified ? Icons.CHECK_CIRCLE : Icons.ALERT_CIRCLE,
              }),
              m(
                'label',
                {
                  style: {
                    color: emailVerified ? Colors.GREEN500 : '#f57c01',
                    position: 'relative',
                    top: '2px',
                  },
                },
                emailVerified
                  ? 'Verified'
                  : app.user.email
                  ? 'Not verified'
                  : 'No email'
              ),
            ],
        errorMessage && m('p.error', errorMessage),
      ]),
      m('.LinkButtonWrapper', [
        m('.GithubWell', [
          m('form', [
            githubAccount &&
              m(Input, {
                value: `github.com/${githubAccount.username || ''}`,
                contentLeft: m(Icon, { name: Icons.GITHUB }),
                disabled: true,
              }),
            m(Button, {
              label: githubAccount ? 'Unlink Github' : 'Link Github',
              intent: githubAccount ? 'negative' : 'primary',
              rounded: true,
              onclick: () => {
                if (githubAccount) {
                  $.ajax({
                    url: `${app.serverUrl()}/githubAccount`,
                    data: { jwt: app.user.jwt },
                    type: 'DELETE',
                    success: (result) => {
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
              },
            }),
          ]),
        ]),
        m('.DiscordWell', [
          m('form', [
            discordAccount &&
              m(Input, {
                value: `${discordAccount.username || ''}`,
                contentLeft: m(Icon, { name: Icons.DISC }), // TODO: add a discord icon
                disabled: true,
              }),
            m(Button, {
              label: discordAccount ? 'Unlink Discord' : 'Link Discord',
              intent: discordAccount ? 'negative' : 'primary',
              rounded: true,
              onclick: () => {
                if (discordAccount) {
                  $.ajax({
                    url: `${app.serverUrl()}/discordAccount`,
                    data: { jwt: app.user.jwt },
                    type: 'DELETE',
                    success: (result) => {
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
              },
            }),
          ]),
        ]),
      ]),
    ];
  }
}
