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
  } from 'mithrilInterop';
import { getProposalUrlPath } from 'identifiers';
import type { NotificationSubscription } from 'models';
import { AddressInfo } from 'models';

import 'pages/notification_settings/helper_components.scss';

import app from 'state';
import { slugify } from '../../../../../shared/utils';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../../components/component_kit/cw_text';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { User } from '../../components/user/user';
import { getNotificationTypeText } from './helpers';

const getTextRows = (subscription: NotificationSubscription) => {
  if (subscription.Thread) {
    const threadUrl = getProposalUrlPath(
      subscription.Thread.slug,
      `${subscription.Thread.identifier}-${slugify(subscription.Thread.title)}`,
      undefined,
      subscription.Chain.id
    );

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
          {renderQuillTextBody(subscription.Thread.body, {
            collapse: true,
            hideFormatting: true,
          })}
        </CWText>
      </>
    );
  } else if (subscription.Comment) {
    // TODO Gabe 9/7/22 - comment headers should link to comments

    // const parentThread = app.threads.getById(
    //   Number(subscription.Comment.rootProposal.slice(-4))
    // );

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
              hideAvatar
              user={
                new AddressInfo(
                  null,
                  subscription.Comment.author,
                  subscription.Comment.chain,
                  null
                )
              }
            />
            's
          </CWText>
          <CWText
            type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'b2'}
            className="attribution-text"
          >
            comment
          </CWText>
        </div>
        <CWText type="caption" className="subscription-body-text" noWrap>
          {renderQuillTextBody(subscription.Comment.text, {
            collapse: true,
            hideFormatting: true,
          })}
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
        onClick={() => setRoute(subscription.Chain.id)}
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
          {subscription.Chain?.name}
        </CWText>
      </div>
    );
  } else {
    return null;
  }
};

type SubscriptionRowAttrs = {
  subscription: NotificationSubscription;
};

export class SubscriptionRowTextContainer extends ClassComponent<SubscriptionRowAttrs> {
  view(vnode: ResultNode<SubscriptionRowAttrs>) {
    const { subscription } = vnode.attrs;

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
          {getTextRows(subscription)}
        </div>
      </div>
    );
  }
}

export class SubscriptionRowMenu extends ClassComponent<SubscriptionRowAttrs> {
  view(vnode: ResultNode<SubscriptionRowAttrs>) {
    const { subscription } = vnode.attrs;
    return (
      <PopoverMenu
        renderTrigger={(onclick) => (
          <CWIconButton iconName="dotsVertical" onClick={onclick} />
        )}
        menuItems={[
          {
            label: 'Unsubscribe',
            iconLeft: 'close',
            isSecondary: true,
            onClick: () =>
              app.user.notifications
                .deleteSubscription(subscription)
                .then(() => {
                  redraw();
                }),
          },
        ]}
      />
    );
  }
}
