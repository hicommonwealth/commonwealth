import { NotificationCategories } from '@hicommonwealth/shared';
import useForceRerender from 'hooks/useForceRerender';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/notification_settings/index.scss';
import React, { useEffect } from 'react';
import app from 'state';
import {
  useUpdateUserEmailMutation,
  useUpdateUserEmailSettingsMutation,
} from 'state/api/user';
import useUserStore from 'state/ui/user';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWCollapsible } from '../../components/component_kit/cw_collapsible';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { User } from '../../components/user/user';
import { PageLoading } from '../loading';
import {
  SubscriptionRowMenu,
  SubscriptionRowTextContainer,
} from './helper_components';
import useNotificationSettings, {
  SnapshotInfo,
} from './useNotificationSettings';

const emailIntervalFrequencyMap = {
  never: 'Never',
  weekly: 'Once a week',
  daily: 'Everyday',
  twoweeks: 'Every two weeks',
  monthly: 'Once a month',
};

const NotificationSettingsPage = () => {
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();
  const user = useUserStore();

  const { mutateAsync: updateEmail } = useUpdateUserEmailMutation({});
  const { mutateAsync: updateEmailSettings } =
    useUpdateUserEmailSettingsMutation();

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

  // TODO Jake 6/4/24: ALLOW UPDATING EMAIL ONCE VERIFIED
  return (
    <CWPageLayout>
      <div className="NotificationSettingsPage">
        <CWText type="h3" fontWeight="semiBold" className="page-header-text">
          Notification Management
        </CWText>

        <CWText className="page-subheader-text">
          Notification settings for all new threads, comments, mentions, likes,
          and chain events in the following communities.
        </CWText>

        <div className="email-management-section">
          <div className="text-description">
            <CWText type="h5">Scheduled Email Digest</CWText>
            <CWText type="b2" className="subtitle-text">
              Bundle top posts from all your communities via email as often as
              you need it.
            </CWText>
          </div>
          {user.isEmailVerified ? (
            <PopoverMenu
              renderTrigger={(onclick) => (
                <CWButton
                  buttonType="secondary"
                  label={emailIntervalFrequencyMap[currentFrequency]}
                  iconRight="chevronDown"
                  onClick={onclick}
                />
              )}
              menuItems={[
                {
                  label: 'Once a week',
                  onClick: () => {
                    updateEmailSettings({
                      emailNotificationInterval: 'weekly',
                    }).catch(console.log);
                    setCurrentFrequency('weekly');
                    forceRerender();
                  },
                },
                {
                  label: 'Never',
                  onClick: () => {
                    updateEmailSettings({
                      emailNotificationInterval: 'never',
                    }).catch(console.log);
                    setCurrentFrequency('never');
                    forceRerender();
                  },
                },
              ]}
            />
          ) : (
            <CWText className="alert-text">
              Verify Email to set Digest Interval
            </CWText>
          )}
        </div>
        {(!user.email || !user.isEmailVerified) && (
          <div className="email-input-section">
            <CWCard fullWidth className="email-card">
              {sentEmail ? (
                <div className="loading-state">
                  <CWText>
                    Check your email to verify the your account. Refresh this
                    page when finished connecting.
                  </CWText>
                </div>
              ) : (
                <>
                  <CWText type="h5">Email Request</CWText>
                  <CWText type="b1">
                    {`Mmm...seems like we don't have your email on file? Enter your
                  email below so we can send you scheduled email digests.`}
                  </CWText>
                  <div className="email-input-row">
                    <CWTextInput
                      placeholder="Enter Email"
                      containerClassName="email-input"
                      inputValidationFn={(value) => {
                        const validEmailRegex = /\S+@\S+\.\S+/;

                        if (!validEmailRegex.test(value)) {
                          setEmailValidated(false);
                          return [
                            'failure',
                            'Please enter a valid email address',
                          ];
                        } else {
                          setEmailValidated(true);
                          return [];
                        }
                      }}
                      onInput={(e) => {
                        setEmail(e.target.value);
                      }}
                    />
                    <CWButton
                      label="Save"
                      buttonHeight="sm"
                      disabled={!emailValidated}
                      onClick={() => {
                        updateEmail({ email })
                          .then(() => {
                            setSentEmail(true);
                          })
                          .catch((e) => console.log(e));
                      }}
                    />
                  </div>
                </>
              )}
            </CWCard>
          </div>
        )}
        <CWText
          type="h4"
          fontWeight="semiBold"
          className="chain-events-section-margin"
        >
          Chain Events
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
        {relevantSubscribedCommunities
          .sort((x, y) => x.name.localeCompare(y.name))
          .map((community) => {
            return (
              <div
                className="notification-row chain-events-subscriptions-padding"
                key={community.id}
              >
                <div className="notification-row-header">
                  <div className="left-content-container">
                    <div className="avatar-and-name">
                      <CWCommunityAvatar size="medium" community={community} />
                      <CWText type="h5" fontWeight="medium">
                        {community.name}
                      </CWText>
                    </div>
                  </div>
                  <CWCheckbox
                    label="Receive Emails"
                    disabled={true}
                    checked={false}
                    onChange={() => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      handleEmailSubscriptions(false, []);
                    }}
                  />
                  <CWToggle
                    checked={false}
                    onChange={() => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      app.user.notifications
                        .subscribe({
                          categoryId: NotificationCategories.ChainEvent,
                          options: { communityId: community.id },
                        })
                        .then(() => {
                          forceRerender();
                        });
                    }}
                  />
                </div>
              </div>
            );
          })}

        {Object.entries(chainEventSubs)
          .sort((x, y) => x[0].localeCompare(y[0]))
          .map(([communityName, subs]) => {
            const communityInfo = app.config.chains.getById(communityName);
            const hasSomeEmailSubs = subs.some((s) => s.immediateEmail);
            const hasSomeInAppSubs = subs.some((s) => s.isActive);

            return (
              <div
                className="notification-row chain-events-subscriptions-padding"
                key={communityInfo?.id}
              >
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
                  </div>
                  <CWCheckbox
                    label="Receive Emails"
                    checked={hasSomeEmailSubs}
                    onChange={() => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      handleEmailSubscriptions(hasSomeEmailSubs, subs);
                    }}
                  />
                  <CWToggle
                    checked={hasSomeInAppSubs}
                    onChange={() => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      handleSubscriptions(hasSomeInAppSubs, subs);
                    }}
                  />
                </div>
              </div>
            );
          })}
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
                        // eslint-disable-next-line @typescript-eslint/no-misused-promises
                        onChange={() =>
                          handleEmailSubscriptions(hasSomeEmailSubs, subs)
                        }
                      />
                      <CWToggle
                        checked={hasSomeInAppSubs}
                        // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
                                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
        <div>
          <CWText
            type="h4"
            fontWeight="semiBold"
            className="chain-events-section-margin"
          >
            Snapshot Subscriptions
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
        </div>
        {snapshotsInfo &&
          // @ts-expect-error <StrictNullChecks/>
          snapshotsInfo.map((snapshot: SnapshotInfo) => {
            //destructuring snapshotInfo for readability
            const { snapshotId, space, subs } = snapshot;
            if (!snapshotId) return null; // handles incomplete loading case

            //remove ipfs:// from avatar
            const avatar = space.avatar.replace('ipfs://', '');

            const hasSomeEmailSubs = subs.some((s) => s.immediateEmail);
            const hasSomeInAppSubs = subs.some((s) => s.isActive);

            return (
              <div
                className="notification-row chain-events-subscriptions-padding"
                key={snapshotId}
              >
                <div className="notification-row-header">
                  <div className="left-content-container">
                    <div className="avatar-and-name">
                      <img
                        className="snapshot-icon"
                        src={`${app.serverUrl()}/ipfsProxy?hash=${avatar}&image=true`}
                      />
                      <CWText type="h5" fontWeight="medium">
                        {space.name}
                      </CWText>
                    </div>
                  </div>
                  <CWCheckbox
                    label="Receive Emails"
                    checked={hasSomeEmailSubs}
                    onChange={() => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      handleEmailSubscriptions(hasSomeEmailSubs, subs);
                    }}
                  />
                  <CWToggle
                    checked={hasSomeInAppSubs}
                    onChange={() => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      handleSubscriptions(hasSomeInAppSubs, subs);
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </CWPageLayout>
  );
};

export default NotificationSettingsPage;
