import useForceRerender from 'hooks/useForceRerender';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/notification_settings/index.scss';
import React, { useEffect } from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
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
import useNotificationSettings from './useNotificationSettings';

const emailIntervalFrequencyMap = {
  never: 'Never',
  weekly: 'Once a week',
  daily: 'Everyday',
  twoweeks: 'Every two weeks',
  monthly: 'Once a month',
};

const NotificationSettingsPage2 = () => {
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();

  const {
    email,
    setEmail,
    emailValidated,
    setEmailValidated,
    snapshotsInfo,
    sentEmail,
    setSentEmail,
    currentFrequency,
    setCurrentFrequency,
    handleSubscriptions,
    handleEmailSubscriptions,
    handleUnsubscribe,
    bundledSubs,
    chainEventSubs,
    relevantSubscribedCommunities,
  } = useNotificationSettings();

  useEffect(() => {
    app.user.notifications.isLoaded.once('redraw', forceRerender);
  }, [forceRerender]);

  if (!app.loginStatusLoaded()) {
    return <PageLoading />;
  } else if (!app.isLoggedIn()) {
    navigate('/', { replace: true });
    return <PageLoading />;
  }

  console.log('FIXME: ', JSON.stringify(bundledSubs, null, '  '));

  // const threads = useMemo(() => {
  //   bundledSubs
  // })
  //
  // app.

  const discussionSubscriptions =
    app?.user.notifications.discussionSubscriptions || [];

  return (
    <CWPageLayout>
      <div className="NotificationSettingsPage">
        <CWText type="h3" fontWeight="semiBold" className="page-header-text">
          Notification settings
        </CWText>
        <CWText className="page-subheader-text">
          Manage the emails and alerts you receive about your activity
        </CWText>

        {discussionSubscriptions
          .filter((current) => current.Thread)
          .map((current) => (
            <div>{current.Thread.title}</div>
          ))}

        <CWText
          type="h4"
          fontWeight="semiBold"
          className="discussion-section-margin"
        >
          Discussion
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

        {Object.entries(bundledSubs)
          .sort((x, y) => x[0].localeCompare(y[0]))
          .map(([communityName, subs]) => {
            const communityInfo = app?.config.chains.getById(communityName);
            const sortedSubs = subs.sort((a, b) =>
              a.category.localeCompare(b.category),
            );
            const hasSomeEmailSubs = sortedSubs.some((s) => s.immediateEmail);
            const hasSomeInAppSubs = sortedSubs.some((s) => s.isActive);

            if (!communityInfo?.id) return null; // handles incomplete loading case

            return (
              <div key={communityInfo?.id} className="notification-row">
                <CWCollapsible
                  headerContent={
                    <div className="notification-row-header">
                      <div className="left-content-container">
                        <div className="avatar-and-name">
                          <CWCommunityAvatar
                            size="medium"
                            community={communityInfo}
                          />
                          <CWText type="h5" fontWeight="medium">
                            {communityInfo?.name}
                          </CWText>
                        </div>
                        <CWText type="b2" className="subscriptions-count-text">
                          {subs.length} subscriptions
                        </CWText>
                      </div>
                      <CWCheckbox
                        label="Receive Emails"
                        checked={hasSomeEmailSubs}
                        onChange={() =>
                          handleEmailSubscriptions(hasSomeEmailSubs, subs)
                        }
                      />
                      <CWToggle
                        checked={hasSomeInAppSubs}
                        onChange={() =>
                          handleSubscriptions(hasSomeInAppSubs, subs)
                        }
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
                          if (sub.Thread?.communityId) {
                            return (
                              <User
                                userAddress={sub?.Thread?.author}
                                userCommunityId={sub?.Thread?.communityId}
                                shouldShowAsDeleted={
                                  !sub?.Thread?.author &&
                                  !sub?.Thread?.communityId
                                }
                              />
                            );
                          } else if (sub.Comment?.communityId) {
                            return (
                              <User
                                userAddress={sub?.Comment?.author}
                                userCommunityId={sub?.Comment?.communityId}
                                shouldShowAsDeleted={
                                  !sub?.Comment?.author &&
                                  !sub?.Comment?.communityId
                                }
                              />
                            );
                          } else {
                            // return empty div to ensure that grid layout is correct
                            // even in the absence of a user
                            return <div key={sub.id} />;
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
                          <div key={sub.id}>
                            <div className="subscription-row-desktop">
                              <SubscriptionRowTextContainer
                                subscription={sub}
                              />
                              <CWText type="b2">{getTimeStamp()}</CWText>
                              {getUser()}
                              <SubscriptionRowMenu
                                subscription={sub}
                                onUnsubscribe={handleUnsubscribe}
                              />
                            </div>
                            <div className="subscription-row-mobile">
                              <div className="subscription-row-mobile-top">
                                <SubscriptionRowTextContainer
                                  subscription={sub}
                                />
                                <SubscriptionRowMenu
                                  subscription={sub}
                                  onUnsubscribe={handleUnsubscribe}
                                />
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
                          </div>
                        );
                      })}
                    </div>
                  }
                />
              </div>
            );
          })}
      </div>
    </CWPageLayout>
  );
};

export default NotificationSettingsPage2;
