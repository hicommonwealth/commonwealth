import React from 'react';
import type { NavigateOptions, To } from 'react-router';

import { getNotificationUrlPath } from 'identifiers';

import 'pages/notification_settings/helper_components.scss';
import NotificationSubscription from '../../../models/NotificationSubscription';

import { useCommonNavigate } from 'navigation/helpers';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import app from '../../../state';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { User } from '../../components/user/user';
import { getNotificationTypeText } from './helpers';

const getTextRows = (
  subscription: NotificationSubscription,
  setRoute: (
    url: To,
    options?: NavigateOptions,
    prefix?: null | string,
  ) => void,
) => {
  if (subscription.Thread) {
    const threadUrl = getNotificationUrlPath(subscription);

    return (
      <>
        <div className="header-row" onClick={() => setRoute(threadUrl)}>
          <CWText
            type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'b2'}
            className="attribution-text"
            noWrap
          >
            {getNotificationTypeText(subscription.category)}
          </CWText>
          <CWText
            type="b2"
            fontWeight="bold"
            noWrap
            className="thread-title-text"
          >
            {subscription.Thread.title}
          </CWText>
        </div>
        <CWText type="caption" className="subscription-body-text" noWrap>
          {subscription.Thread.plaintext}
        </CWText>
      </>
    );
  } else if (subscription.Comment) {
    // TODO Gabe 9/7/22 - comment headers should link to comments

    // const commentUrl = getProposalUrlPath(
    //   subscription.Thread.slug,
    //   `${subscription.Thread.identifier}-${slugify(subscription.Thread.title)}`,
    //   undefined,
    //   subscription.Chain.id
    // );
    return (
      <>
        <div className="header-row">
          <CWText
            type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'b2'}
            className="attribution-text"
          >
            {getNotificationTypeText(subscription.category)}
          </CWText>
          <CWText
            type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'b2'}
            fontWeight="bold"
          >
            <User
              shouldHideAvatar
              userAddress={subscription?.Comment?.author}
              userCommunityId={subscription?.Comment?.communityId}
              shouldShowAsDeleted={
                !subscription?.Comment?.author &&
                !subscription?.Comment?.communityId
              }
            />
            &apos;
          </CWText>
          <CWText
            type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'b2'}
            className="attribution-text"
          >
            comment
          </CWText>
        </div>
        <CWText type="caption" className="subscription-body-text" noWrap>
          <QuillRenderer doc={subscription.Comment.text} hideFormatting />
        </CWText>
      </>
    );
  } else if (
    !subscription.Thread &&
    !subscription.Comment &&
    subscription.category === 'new-thread-creation'
  ) {
    return (
      <div
        className="header-row"
        onClick={() => setRoute(`/${subscription.communityId}`)}
      >
        <CWText
          type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'b2'}
          className="attribution-text"
        >
          New Threads in
        </CWText>
        <CWText
          type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'b2'}
          fontWeight="bold"
        >
          {app.config.chains.getById(subscription.communityId)?.name}
        </CWText>
      </div>
    );
  } else {
    return null;
  }
};

type SubscriptionRowProps = {
  subscription: NotificationSubscription;
};

export const SubscriptionRowTextContainer = ({
  subscription,
}: SubscriptionRowProps) => {
  const navigate = useCommonNavigate();

  return (
    <div className="SubscriptionRowTextContainer">
      <CWIcon
        iconName={
          subscription.category === 'new-reaction'
            ? 'democraticProposal'
            : 'feedback'
        }
        iconSize="small"
      />
      <div className="title-and-body-container">
        {getTextRows(subscription, navigate)}
      </div>
    </div>
  );
};

type SubscriptionRowMenuProps = {
  subscription: NotificationSubscription;
  onUnsubscribe: (subscription: NotificationSubscription) => void;
};

export const SubscriptionRowMenu = ({
  subscription,
  onUnsubscribe,
}: SubscriptionRowMenuProps) => {
  return (
    <div className="trigger-wrapper">
      <PopoverMenu
        renderTrigger={(onclick) => (
          <CWIconButton iconName="dotsVertical" onClick={onclick} />
        )}
        menuItems={[
          {
            label: 'Unsubscribe',
            iconLeft: 'close',
            isSecondary: true,
            onClick: () => onUnsubscribe(subscription),
          },
        ]}
      />
    </div>
  );
};
