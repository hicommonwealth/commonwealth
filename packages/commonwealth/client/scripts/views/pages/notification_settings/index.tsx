/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import moment from 'moment';

import 'pages/notification_settings/index.scss';

import app from 'state';
import { AddressInfo } from 'models';
import Sublayout from 'views/sublayout';
import { PageLoading } from '../loading';
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

class NotificationSettingsPage extends ClassComponent {
  view() {
    if (!app.loginStatusLoaded()) {
      return (
        <PageLoading
          title={<BreadcrumbsTitleTag title="Notification Settings" />}
        />
      );
    } else if (!app.isLoggedIn()) {
      setRoute('/', {}, { replace: true });
      return <PageLoading />;
    }

    const bundledSubs = bundleSubs(app.user.notifications.subscriptions);

    return (
      <Sublayout
      // title={<BreadcrumbsTitleTag title="Notification Settings" />}
      >
        <div className="NotificationSettingsPage">
          <CWText type="h3" fontWeight="semiBold" class="page-header-text">
            Notification Management
          </CWText>
          <CWText class="page-subheader-text">
            Notification settings for all new threads, comments, mentions,
            likes, and chain events in the following communities.
          </CWText>
          <div className="column-header-row">
            <CWText
              type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'h5'}
              fontWeight="medium"
              class="column-header-text"
            >
              Community
            </CWText>
            <CWText
              type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'h5'}
              fontWeight="medium"
              class="column-header-text"
            >
              Email
            </CWText>
            <CWText
              type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'h5'}
              fontWeight="medium"
              class="last-column-header-text"
            >
              In-App
            </CWText>
          </div>
          {Object.entries(bundledSubs).map(([chainName, subs]) => {
            const chainInfo = app.config.chains.getById(chainName);
            const hasSomeEmailSubs = subs.some((s) => s.immediateEmail);
            const hasSomeInAppSubs = subs.some((s) => s.isActive);

            return (
              <div className="notification-row">
                <CWCollapsible
                  headerContent={
                    <div className="notification-row-header">
                      <div class="left-content-container">
                        <div className="avatar-and-name">
                          <CWCommunityAvatar
                            size="medium"
                            community={chainInfo}
                          />
                          <CWText type="h5" fontWeight="medium">
                            {chainInfo?.name}
                          </CWText>
                        </div>
                        <CWText type="b2" class="subscriptions-count-text">
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
                                  redraw();
                                })
                            : app.user.notifications
                                .enableImmediateEmails(subs)
                                .then(() => {
                                  redraw();
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
                                  redraw();
                                })
                            : app.user.notifications
                                .enableSubscriptions(subs)
                                .then(() => {
                                  redraw();
                                });
                        }}
                      />
                    </div>
                  }
                  collapsibleContent={
                    <div className="subscriptions-list-container">
                      <div className="subscriptions-list-header">
                        <CWText
                          type="caption"
                          class="subscription-list-header-text"
                        >
                          Title
                        </CWText>
                        <CWText
                          type="caption"
                          class="subscription-list-header-text"
                        >
                          Subscribed
                        </CWText>
                        <CWText
                          type="caption"
                          class="subscription-list-header-text"
                        >
                          Author
                        </CWText>
                      </div>
                      {subs.map((sub) => {
                        const getUser = () => {
                          if (sub.Thread) {
                            return render(User, {
                              user: new AddressInfo(
                                null,
                                sub.Thread.author,
                                sub.Thread.chain,
                                null
                              ),
                            });
                          } else if (sub.Comment) {
                            return render(User, {
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
                            <div className="subscription-row-desktop">
                              <SubscriptionRowTextContainer
                                subscription={sub}
                              />
                              <CWText type="b2">{getTimeStamp()}</CWText>
                              {getUser()}
                              <SubscriptionRowMenu subscription={sub} />
                            </div>
                            <div className="subscription-row-mobile">
                              <div className="subscription-row-mobile-top">
                                <SubscriptionRowTextContainer
                                  subscription={sub}
                                />
                                <SubscriptionRowMenu subscription={sub} />
                              </div>
                              <div className="subscription-row-mobile-bottom">
                                {getUser()}
                                {getTimeStamp() && (
                                  <CWText
                                    type="caption"
                                    class="subscription-list-header-text"
                                  >
                                    subscribed
                                  </CWText>
                                )}
                                <CWText
                                  type="caption"
                                  fontWeight="medium"
                                  class="subscription-list-header-text"
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
