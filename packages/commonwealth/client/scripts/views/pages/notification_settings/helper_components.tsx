/* @jsx m */

import m from 'mithril';

import 'pages/notification_settings/helper_components.scss';

import app from 'state';
import { getProposalUrlPath } from 'identifiers';
import { AddressInfo, NotificationSubscription } from 'models';
import { slugify } from '../../../../../shared/utils';
import { CWText } from '../../components/component_kit/cw_text';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import User from '../../components/widgets/user';
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

export class SubscriptionRowTextContainer
  implements m.ClassComponent<{ subscription: NotificationSubscription }>
{
  view(vnode) {
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

export class SubscriptionRowMenu
  implements m.ClassComponent<{ subscription: NotificationSubscription }>
{
  view(vnode) {
    const { subscription } = vnode.attrs;
    return (
      <CWPopoverMenu
        trigger={<CWIconButton iconName="dotsVertical" />}
        popoverMenuItems={[
          {
            label: 'Unsubscribe',
            iconName: 'close',
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
