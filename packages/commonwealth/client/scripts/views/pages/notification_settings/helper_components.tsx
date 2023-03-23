/* @jsx m */

import ClassComponent from 'class_component';
import { getProposalUrlPath } from 'identifiers';
import m from 'mithril';
import type { NotificationSubscription } from 'models';
import { AddressInfo } from 'models';

import 'pages/notification_settings/helper_components.scss';

import app from 'state';
import { slugify } from '../../../../../shared/utils';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../../components/component_kit/cw_text';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import { renderQuillTextBody } from '../../components/quill/helpers';
import User from '../../components/widgets/user';
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
        <div class="header-row" onclick={() => m.route.set(threadUrl)}>
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
    //   Number(subscription.comment.threadId.slice(-4))
    // );

    // const commentUrl = getProposalUrlPath(
    //   subscription.Thread.slug,
    //   `${subscription.Thread.identifier}-${slugify(subscription.Thread.title)}`,
    //   undefined,
    //   subscription.Chain.id
    // );
    return (
      <>
        <div class="header-row">
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
            {m(User, {
              hideAvatar: true,
              user: new AddressInfo(
                null,
                subscription.Comment.author,
                subscription.Comment.chain,
                null
              ),
            })}
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
        class="header-row"
        onclick={() => m.route.set(subscription.Chain.id)}
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
  view(vnode: m.Vnode<SubscriptionRowAttrs>) {
    const { subscription } = vnode.attrs;

    return (
      <div class="SubscriptionRowTextContainer">
        <CWIcon
          iconName={
            subscription.category === 'new-reaction'
              ? 'democraticProposal'
              : 'feedback'
          }
          iconSize="small"
        />
        <div class="title-and-body-container">{getTextRows(subscription)}</div>
      </div>
    );
  }
}

export class SubscriptionRowMenu extends ClassComponent<SubscriptionRowAttrs> {
  view(vnode: m.Vnode<SubscriptionRowAttrs>) {
    const { subscription } = vnode.attrs;
    return (
      <CWPopoverMenu
        trigger={<CWIconButton iconName="dotsVertical" />}
        menuItems={[
          {
            label: 'Unsubscribe',
            iconLeft: 'close',
            isSecondary: true,
            onclick: () =>
              app.user.notifications
                .deleteSubscription(subscription)
                .then(() => {
                  m.redraw();
                }),
          },
        ]}
      />
    );
  }
}
