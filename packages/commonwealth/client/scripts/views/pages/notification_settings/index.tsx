/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';
import { AddressInfo } from 'models';
import moment from 'moment';

import 'pages/notification_settings/index.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../../components/breadcrumbs_title_tag';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWCollapsible } from '../../components/component_kit/cw_collapsible';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import User from '../../components/widgets/user';
import { PageLoading } from '../loading';
import {
  SubscriptionRowMenu,
  SubscriptionRowTextContainer,
} from './helper_components';
import { bundleSubs } from './helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWSpinner } from '../../components/component_kit/cw_spinner';

const emailIntervalFrequencyMap = {
  never: 'Never',
  weekly: 'Once a week',
  daily: 'Everyday',
  twoweeks: 'Every two weeks',
  monthly: 'Once a month',
};
class NotificationSettingsPage extends ClassComponent {
  private email: string;
  private emailValidated: boolean;
  private sentEmail: boolean;

  view() {
    if (!app.loginStatusLoaded()) {
      return (
        <PageLoading
          title={<BreadcrumbsTitleTag title="Notification Settings" />}
        />
      );
    } else if (!app.isLoggedIn()) {
      m.route.set('/', {}, { replace: true });
      return <PageLoading />;
    }

    const bundledSubs = bundleSubs(app.user.notifications.subscriptions);
    const currentFrequency = app.user.emailInterval;

    return (
      <Sublayout
      // title={<BreadcrumbsTitleTag title="Notification Settings" />}
      >
        <div class="NotificationSettingsPage">
          <CWText type="h3" fontWeight="semiBold" className="page-header-text">
            Notification Management
          </CWText>
          <CWText className="page-subheader-text">
            Notification settings for all new threads, comments, mentions,
            likes, and chain events in the following communities.
          </CWText>
          <div class="email-management-section">
            <div class="text-description">
              <CWText type="h5">Scheduled Email Digest</CWText>
              <CWText type="b2" className="subtitle-text">
                Bundle top posts from all your communities via email as often as
                you need it.
              </CWText>
            </div>
            <CWPopoverMenu
              trigger={
                <CWButton
                  buttonType="mini-white"
                  label={emailIntervalFrequencyMap[currentFrequency]}
                  iconRight="chevronDown"
                />
              }
              menuItems={[
                {
                  label: 'Once a week',
                  onclick: () => {
                    app.user.updateEmailInterval('weekly');
                  },
                },
                {
                  label: 'Never',
                  onclick: () => {
                    app.user.updateEmailInterval('never');
                  },
                },
              ]}
            />
          </div>
          {(!app.user.email || !app.user.emailVerified) &&
            currentFrequency !== 'never' && (
              <div class="email-input-section">
                <CWCard fullWidth className="email-card">
                  {this.sentEmail ? (
                    <div className="loading-state">
                      <CWText>
                        Check your email to verify the your account. Refresh
                        this page when finished connecting.
                      </CWText>
                    </div>
                  ) : (
                    <>
                      <CWText type="h5">Email Request</CWText>
                      <CWText fontType="b1">
                        Mmm...seems like we don't have your email on file? Enter
                        your email below so we can send you scheduled email
                        digests.
                      </CWText>
                      <div class="email-input-row">
                        <CWTextInput
                          placeholder="Enter Email"
                          containerClassName="email-input"
                          inputValidationFn={(value) => {
                            const validEmailRegex = /\S+@\S+\.\S+/;

                            if (!validEmailRegex.test(value)) {
                              this.emailValidated = false;
                              return [
                                'failure',
                                'Please enter a valid email address',
                              ];
                            } else {
                              this.emailValidated = true;
                              return [];
                            }
                          }}
                          oninput={(e) => {
                            this.email = e.target.value;
                          }}
                        />
                        <CWButton
                          label="Save"
                          buttonType="primary-black"
                          disabled={!this.emailValidated}
                          onclick={() => {
                            try {
                              app.user.updateEmail(this.email);
                              this.sentEmail = true;
                              m.redraw();
                            } catch (e) {
                              console.log(e);
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                </CWCard>
              </div>
            )}
          <div class="column-header-row">
            <CWText
              type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'h5'}
              fontWeight="medium"
              className="column-header-text"
            >
              Community
            </CWText>
            <CWText
              type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'h5'}
              fontWeight="medium"
              className="column-header-text"
            >
              Email
            </CWText>
            <CWText
              type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'h5'}
              fontWeight="medium"
              className="last-column-header-text"
            >
              In-App
            </CWText>
          </div>
          {Object.entries(bundledSubs).map(([chainName, subs]) => {
            const chainInfo = app.config.chains.getById(chainName);
            const hasSomeEmailSubs = subs.some((s) => s.immediateEmail);
            const hasSomeInAppSubs = subs.some((s) => s.isActive);

            return (
              <div class="notification-row">
                <CWCollapsible
                  headerContent={
                    <div class="notification-row-header">
                      <div className="left-content-container">
                        <div class="avatar-and-name">
                          <CWCommunityAvatar
                            size="medium"
                            community={chainInfo}
                          />
                          <CWText type="h5" fontWeight="medium">
                            {chainInfo?.name}
                          </CWText>
                        </div>
                        <CWText type="b2" className="subscriptions-count-text">
                          {subs.length} subscriptions
                        </CWText>
                      </div>
                      <CWCheckbox
                        label="Receive Emails"
                        checked={hasSomeEmailSubs}
                        onchange={() => {
                          hasSomeEmailSubs
                            ? app.user.notifications
                                .disableImmediateEmails(subs)
                                .then(() => {
                                  m.redraw();
                                })
                            : app.user.notifications
                                .enableImmediateEmails(subs)
                                .then(() => {
                                  m.redraw();
                                });
                        }}
                      />
                      <CWToggle
                        checked={subs.some((s) => s.isActive)}
                        onchange={() => {
                          hasSomeInAppSubs
                            ? app.user.notifications
                                .disableSubscriptions(subs)
                                .then(() => {
                                  m.redraw();
                                })
                            : app.user.notifications
                                .enableSubscriptions(subs)
                                .then(() => {
                                  m.redraw();
                                });
                        }}
                      />
                    </div>
                  }
                  collapsibleContent={
                    <div class="subscriptions-list-container">
                      <div class="subscriptions-list-header">
                        <CWText
                          type="caption"
                          className="subscription-list-header-text"
                        >
                          Title
                        </CWText>
                        <CWText
                          type="caption"
                          className="subscription-list-header-text"
                        >
                          Subscribed
                        </CWText>
                        <CWText
                          type="caption"
                          className="subscription-list-header-text"
                        >
                          Author
                        </CWText>
                      </div>
                      {subs.map((sub) => {
                        const getUser = () => {
                          if (sub.Thread) {
                            return m(User, {
                              user: new AddressInfo(
                                null,
                                sub.Thread.author,
                                sub.Thread.chain,
                                null
                              ),
                            });
                          } else if (sub.Comment) {
                            return m(User, {
                              user: new AddressInfo(
                                null,
                                sub.Comment.author,
                                sub.Comment.chain,
                                null
                              ),
                            });
                          } else {
                            // return empty div to ensure that grid layout is correct
                            // even in the absence of a user
                            return <div />;
                          }
                        };

                        const getTimeStamp = () => {
                          if (sub.Thread) {
                            return moment(sub.Thread.createdAt).format('l');
                          } else if (sub.Comment) {
                            return moment(sub.Comment.createdAt).format('l');
                          } else {
                            return null;
                          }
                        };

                        return (
                          <>
                            <div class="subscription-row-desktop">
                              <SubscriptionRowTextContainer
                                subscription={sub}
                              />
                              <CWText type="b2">{getTimeStamp()}</CWText>
                              {getUser()}
                              <SubscriptionRowMenu subscription={sub} />
                            </div>
                            <div class="subscription-row-mobile">
                              <div class="subscription-row-mobile-top">
                                <SubscriptionRowTextContainer
                                  subscription={sub}
                                />
                                <SubscriptionRowMenu subscription={sub} />
                              </div>
                              <div class="subscription-row-mobile-bottom">
                                {getUser()}
                                {getTimeStamp() && (
                                  <CWText
                                    type="caption"
                                    className="subscription-list-header-text"
                                  >
                                    subscribed
                                  </CWText>
                                )}
                                <CWText
                                  type="caption"
                                  fontWeight="medium"
                                  className="subscription-list-header-text"
                                >
                                  {getTimeStamp()}
                                </CWText>
                              </div>
                            </div>
                          </>
                        );
                      })}
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      </Sublayout>
    );
  }
}

export default NotificationSettingsPage;
