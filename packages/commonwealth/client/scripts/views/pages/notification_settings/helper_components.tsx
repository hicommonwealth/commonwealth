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

import 'pages/notification_settings/helper_components.scss';

import app from 'state';
import { getProposalUrlPath } from 'identifiers';
import { AddressInfo, NotificationSubscription } from 'models';
import { slugify } from '../../../../../shared/utils';
import { CWText } from '../../components/component_kit/cw_text';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { ReactPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { User } from '../../components/user/user';
import { getNotificationTypeText } from './helpers';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';

const getTextRows = (subscription: NotificationSubscription) => {
  if (subscription.Thread) {
    const threadUrl = getProposalUrlPath(
      subscription.Thread.slug,
      `${subscription.Thread.identifier}-${slugify(subscription.Thread.title)}`,
      undefined,
      subscription.Chain.id
    );

    return (
      <React.Fragment>
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
      </React.Fragment>
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
      <React.Fragment>
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
      </React.Fragment>
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
      <ReactPopoverMenu
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
