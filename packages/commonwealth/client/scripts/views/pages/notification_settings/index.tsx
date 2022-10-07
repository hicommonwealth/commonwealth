/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/notification_settings/index.scss';

import app from 'state';
import { AddressInfo } from 'models';
import Sublayout from 'views/sublayout';
import { PageLoading } from '../loading';
import ErrorPage from '../error';
import { BreadcrumbsTitleTag } from '../../components/breadcrumbs_title_tag';
import { CWText } from '../../components/component_kit/cw_text';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWCollapsible } from '../../components/component_kit/cw_collapsible';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import User from '../../components/widgets/user';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import {
  SubscriptionRowTextContainer,
  SubscriptionRowMenu,
} from './helper_components';
import { bundleSubs } from './helpers';
import { CWPopover } from '../../components/component_kit/cw_popover/cw_popover';
import { CWTooltip } from '../../components/component_kit/cw_popover/cw_tooltip';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

class NotificationSettingsPage implements m.ClassComponent {
  private browserNotifsEnabled: boolean;
  oninit() {
    this.browserNotifsEnabled =
      Notification.permission === 'granted' &&
      app.user.browserNotificationsEnabled;
  }
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
          <div className="browser-notifications">
            <CWToggle
              checked={this.browserNotifsEnabled}
              onchange={async () => {
                if (!this.browserNotifsEnabled) {
                  const status =
                    await app.user.notifications.requestBrowserNotifications();
                  if (status === 'granted') this.browserNotifsEnabled = true;
                  m.redraw();
                } else {
                  try {
                    await app.user.notifications.updateBrowserNotificationsStatus(
                      false
                    );
                    this.browserNotifsEnabled = false;
                  } catch (e) {
                    console.log(e);
                  }

                  m.redraw();
                }
              }}
            />
            <CWText className="browser-notif-text">
              {this.browserNotifsEnabled
                ? 'Disable Browser Notifications'
                : 'Enable Browser Notifications'}
            </CWText>
            <CWTooltip
              trigger={<CWIcon iconName="infoEmpty" iconSize="small" />}
              interactionType="hover"
              tooltipType="bordered"
              toSide={true}
              persistOnHover={true}
              hoverCloseDelay={300}
              tooltipContent={
                <div>
                  Not working? Try checking your browser or machine settings.
                </div>
              }
            />
          </div>

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
