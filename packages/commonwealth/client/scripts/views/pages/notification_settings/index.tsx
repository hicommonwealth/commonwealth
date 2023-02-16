import React from 'react';

import moment from 'moment';
import { AddressInfo } from 'models';
import 'pages/notification_settings/index.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWCollapsible } from '../../components/component_kit/cw_collapsible';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { User } from '../../components/user/user';
import { PageLoading } from '../loading';
import {
  SubscriptionRowMenu,
  SubscriptionRowTextContainer,
} from './helper_components';
import { bundleSubs } from './helpers';
import { useCommonNavigate } from 'navigation/helpers';

const NotificationSettingsPage = () => {
  const navigate = useCommonNavigate();

  if (!app.loginStatusLoaded()) {
    return <PageLoading />;
  } else if (!app.isLoggedIn()) {
    navigate('/', { replace: true });
    return <PageLoading />;
  }

  const bundledSubs = bundleSubs(app.user.notifications.subscriptions);

  return (
    <Sublayout>
      <div className="NotificationSettingsPage">
        <CWText type="h3" fontWeight="semiBold" className="page-header-text">
          Notification Management
        </CWText>
        <CWText className="page-subheader-text">
          Notification settings for all new threads, comments, mentions, likes,
          and chain events in the following communities.
        </CWText>
        <div className="column-header-row">
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
            <div className="notification-row">
              <CWCollapsible
                headerContent={
                  <div className="notification-row-header">
                    <div className="left-content-container">
                      <div className="avatar-and-name">
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
                      onChange={() => {
                        hasSomeEmailSubs
                          ? app.user.notifications.disableImmediateEmails(subs)
                          : app.user.notifications.enableImmediateEmails(subs);
                      }}
                    />
                    <CWToggle
                      checked={subs.some((s) => s.isActive)}
                      onChange={() => {
                        hasSomeInAppSubs
                          ? app.user.notifications.disableSubscriptions(subs)
                          : app.user.notifications.enableSubscriptions(subs);
                      }}
                    />
                  </div>
                }
                collapsibleContent={
                  <div className="subscriptions-list-container">
                    <div className="subscriptions-list-header">
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
                          return (
                            <User
                              user={
                                new AddressInfo(
                                  null,
                                  sub.Thread.author,
                                  sub.Thread.chain,
                                  null
                                )
                              }
                            />
                          );
                        } else if (sub.Comment) {
                          return (
                            <User
                              user={
                                new AddressInfo(
                                  null,
                                  sub.Comment.author,
                                  sub.Comment.chain,
                                  null
                                )
                              }
                            />
                          );
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
                            <SubscriptionRowTextContainer subscription={sub} />
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
};

export default NotificationSettingsPage;
