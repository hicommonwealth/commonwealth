import React, { useEffect, useState } from 'react';

import moment from 'moment';
import 'pages/notification_settings/index.scss';

import app from 'state';
import Sublayout from 'views/Sublayout';
import AddressInfo from '../../../models/AddressInfo';
import NotificationSubscription from '../../../models/NotificationSubscription';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWCollapsible } from '../../components/component_kit/cw_collapsible';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import { CWButton } from '../../components/component_kit/cw_button';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWCard } from '../../components/component_kit/cw_card';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { User } from '../../components/user/user';
import { PageLoading } from '../loading';
import {
  SubscriptionRowMenu,
  SubscriptionRowTextContainer,
} from './helper_components';
import { bundleSubs } from './helpers';
import { useCommonNavigate } from 'navigation/helpers';
import useForceRerender from 'hooks/useForceRerender';
import { NotificationCategories } from 'common-common/src/types';

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
  const [email, setEmail] = useState('');
  const [emailValidated, setEmailValidated] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);

  const [currentFrequency, setCurrentFrequency] = useState(
    app.user.emailInterval
  );

  useEffect(() => {
    app.user.notifications.isLoaded.once('redraw', forceRerender);
  }, [app?.user.notifications, app.user.emailInterval]);

  const handleSubscriptions = async (
    hasSomeInAppSubs: boolean,
    subs: NotificationSubscription[]
  ) => {
    if (hasSomeInAppSubs) {
      await app.user.notifications.disableSubscriptions(subs);
    } else {
      await app.user.notifications.enableSubscriptions(subs);
    }
    forceRerender();
  };

  const handleEmailSubscriptions = async (
    hasSomeEmailSubs: boolean,
    subs: NotificationSubscription[]
  ) => {
    if (hasSomeEmailSubs) {
      await app.user.notifications.disableImmediateEmails(subs);
    } else {
      await app.user.notifications.enableImmediateEmails(subs);
    }
    forceRerender();
  };

  const handleUnsubscribe = async (subscription: NotificationSubscription) => {
    await app.user.notifications.deleteSubscription(subscription);
    forceRerender();
  };

  if (!app.loginStatusLoaded()) {
    return <PageLoading />;
  } else if (!app.isLoggedIn()) {
    navigate('/', { replace: true });
    return <PageLoading />;
  }

  // bundled discussion subscriptions
  const bundledSubs = bundleSubs(
    app?.user.notifications.subscriptions.filter(
      (x) => x.category !== 'chain-event'
    )
  );
  // bundled chain-event subscriptions
  const chainEventSubs = bundleSubs(
    app?.user.notifications.subscriptions.filter(
      (x) => x.category === 'chain-event'
    )
  );

  const subscribedChainIds =
    app?.user.notifications.chainEventSubscribedChainIds;

  // chains/communities the user has addresses for but does not have existing subscriptions for
  const relevantSubscribedChains = app?.user.addresses
    .map((x) => x.chain)
    .filter((x) => subscribedChainIds.includes(x.id) && !chainEventSubs[x.id]);

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
        <div className="email-management-section">
          <div className="text-description">
            <CWText type="h5">Scheduled Email Digest</CWText>
            <CWText type="b2" className="subtitle-text">
              Bundle top posts from all your communities via email as often as
              you need it.
            </CWText>
          </div>
          {app.user.emailVerified ? (
            <PopoverMenu
              renderTrigger={(onclick) => (
                <CWButton
                  buttonType="mini-white"
                  label={emailIntervalFrequencyMap[currentFrequency]}
                  iconRight="chevronDown"
                  onClick={onclick}
                />
              )}
              menuItems={[
                {
                  label: 'Once a week',
                  onClick: () => {
                    app.user.updateEmailInterval('weekly');
                    setCurrentFrequency('weekly');
                    forceRerender();
                  },
                },
                {
                  label: 'Never',
                  onClick: () => {
                    app.user.updateEmailInterval('never');
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
        {(!app.user.email || !app.user.emailVerified) && (
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
                    Mmm...seems like we don't have your email on file? Enter
                    your email below so we can send you scheduled email digests.
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
                      buttonType="primary-black"
                      disabled={!emailValidated}
                      onClick={() => {
                        try {
                          app.user.updateEmail(email);
                          setSentEmail(true);
                          // forceRerender();
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
        {relevantSubscribedChains
          .sort((x, y) => x.name.localeCompare(y.name))
          .map((chain) => {
            return (
              <div
                className="notification-row chain-events-subscriptions-padding"
                key={chain.id}
              >
                <div className="notification-row-header">
                  <div className="left-content-container">
                    <div className="avatar-and-name">
                      <CWCommunityAvatar size="medium" community={chain} />
                      <CWText type="h5" fontWeight="medium">
                        {chain.name}
                      </CWText>
                    </div>
                  </div>
                  <CWCheckbox
                    label="Receive Emails"
                    disabled={true}
                    checked={false}
                    onChange={() => {
                      handleEmailSubscriptions(false, []);
                    }}
                  />
                  <CWToggle
                    checked={false}
                    onChange={() => {
                      app.user.notifications
                        .subscribe(NotificationCategories.ChainEvent, chain.id)
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
          .map(([chainName, subs]) => {
            const chainInfo = app.config.chains.getById(chainName);
            const hasSomeEmailSubs = subs.some((s) => s.immediateEmail);
            const hasSomeInAppSubs = subs.some((s) => s.isActive);
            return (
              <div
                className="notification-row chain-events-subscriptions-padding"
                key={chainName}
              >
                <div className="notification-row-header">
                  <div className="left-content-container">
                    <div className="avatar-and-name">
                      <CWCommunityAvatar size="medium" community={chainInfo} />
                      <CWText type="h5" fontWeight="medium">
                        {chainInfo?.name}
                      </CWText>
                    </div>
                  </div>
                  <CWCheckbox
                    label="Receive Emails"
                    checked={hasSomeEmailSubs}
                    onChange={() => {
                      handleEmailSubscriptions(hasSomeEmailSubs, subs);
                    }}
                  />
                  <CWToggle
                    checked={hasSomeInAppSubs}
                    onChange={() => {
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
          .map(([chainName, subs]) => {
            const chainInfo = app?.config.chains.getById(chainName);
            const hasSomeEmailSubs = subs.some((s) => s.immediateEmail);
            const hasSomeInAppSubs = subs.some((s) => s.isActive);

            if (!chainInfo?.id) return null; // handles incomplete loading case

            return (
              <div key={chainInfo?.id} className="notification-row">
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
                          if (sub.Thread?.chain) {
                            return (
                              <User
                                user={
                                  new AddressInfo({
                                    id: null,
                                    address: sub.Thread.author,
                                    chainId: sub.Thread.chain,
                                  })
                                }
                              />
                            );
                          } else if (sub.Comment?.chain) {
                            return (
                              <User
                                user={
                                  new AddressInfo({
                                    id: null,
                                    address: sub.Comment.author,
                                    chainId: sub.Comment.chain,
                                  })
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
    </Sublayout>
  );
};

export default NotificationSettingsPage;
