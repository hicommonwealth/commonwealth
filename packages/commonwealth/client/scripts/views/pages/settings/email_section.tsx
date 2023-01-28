/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import $ from 'jquery';
import type { SocialAccount } from 'models';
import { navigateToSubpage } from 'router';

import 'pages/settings/email_section.scss';

import app from 'state';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { getClasses } from '../../components/component_kit/helpers';

export class EmailSection extends ClassComponent {
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
      <div className="EmailSection">
        <div className="login-container">
          <CWText type="h5" fontWeight="semiBold">
            Login
          </CWText>
          <CWTextInput
            placeholder="name@example.com"
            value={this.email || null}
            onInput={(e) => {
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
              onClick={async () => {
                this.errorMessage = null;

                const confirmed = await confirmationModalWithText(
                  'You will be required to confirm your new email address. Continue?'
                )();

                if (!confirmed) return;

                try {
                  await $.post(`${app.serverUrl()}/updateEmail`, {
                    email: this.email,
                    jwt: app.user.jwt,
                  });

                  this.emailVerified = false;

                  this.verificationSent = true;

                  this.errorMessage = null;

                  redraw();
                } catch (err) {
                  this.errorMessage = err.responseJSON.error;

                  redraw();

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
                    this.githubAccount = null;
                    redraw();
                  },
                  error: (err) => {
                    console.dir(err);
                    redraw();
                  },
                });
              } else {
                localStorage.setItem(
                  'githubPostAuthRedirect',
                  JSON.stringify({
                    timestamp: (+new Date()).toString(),
                    path: getRoute(),
                  })
                );
                document.location = `${app.serverUrl()}/auth/github` as any;
                redraw();
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
                    this.discordAccount = null;
                    redraw();
                  },
                  error: (err) => {
                    console.dir(err);
                    redraw();
                  },
                });
              } else {
                localStorage.setItem(
                  'discordPostAuthRedirect',
                  JSON.stringify({
                    timestamp: (+new Date()).toString(),
                    path: getRoute(),
                  })
                );
                document.location = `${app.serverUrl()}/auth/discord` as any;
                redraw();
              }
            }}
          />
        </div>
      </div>
    );
  }
}
