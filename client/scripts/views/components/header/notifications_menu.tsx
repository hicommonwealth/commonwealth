/* @jsx m */

import m from 'mithril';
import Infinite from 'mithril-infinite';
import { PopoverMenu, Button } from 'construct-ui';

import 'components/header/notifications_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import NotificationRow from 'views/components/notification_row';
import { sortNotifications } from 'helpers/notifications';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

const MAX_NOTIFS = 40; // limit number of notifications shown

type NotificationsMenuFooterAttrs = { showingChainNotifications: boolean };

class NotificationsMenuFooter
  implements m.ClassComponent<NotificationsMenuFooterAttrs>
{
  view(vnode) {
    const { showingChainNotifications } = vnode.attrs;

    const notifications = app.user.notifications.notifications;

    const chainEventNotifications = app.user.notifications.notifications.filter(
      (n) => n.chainEvent
    );

    return (
      <div class="NotificationsMenuFooter">
        <Button
          label="See all"
          onclick={() =>
            app.activeChainId()
              ? navigateToSubpage('/notifications')
              : m.route.set('/notifications')
          }
        />
        {showingChainNotifications ? (
          <Button
            label="Mark all read"
            onclick={async (e) => {
              e.preventDefault();
              if (chainEventNotifications.length < 1) return;
              app.user.notifications
                .markAsRead(chainEventNotifications)
                ?.then(() => m.redraw());
            }}
          />
        ) : (
          <Button
            label="Mark all read"
            onclick={(e) => {
              e.preventDefault();
              if (notifications.length < 1) return;
              app.user.notifications
                .markAsRead(notifications)
                ?.then(() => m.redraw());
            }}
          />
        )}
      </div>
    );
  }
}

type NotificationsMenuAttrs = { small?: boolean };

export class NotificationsMenu
  implements m.ClassComponent<NotificationsMenuAttrs>
{
  private selectedChainEvents: boolean;

  view(vnode) {
    // TODO: Add helper directly on controller
    const { small } = vnode.attrs;

    const notifications = app.user.notifications?.notifications || [];

    const filteredNotifications = this.selectedChainEvents
      ? notifications.filter((n) => n.chainEvent)
      : notifications.filter((n) => !n.chainEvent);

    const sortedFilteredNotifications = sortNotifications(
      filteredNotifications
    ).reverse();

    const unreadNotifications = notifications.filter((n) => !n.isRead);

    const unreadNotificationsCount = unreadNotifications.length;

    const unreadFilteredNotificationsCount = filteredNotifications.filter(
      (n) => !n.isRead
    ).length;

    const chainNotificationsCount = this.selectedChainEvents
      ? unreadFilteredNotificationsCount
      : unreadNotificationsCount - unreadFilteredNotificationsCount;

    const discussionNotificationsCount = this.selectedChainEvents
      ? unreadNotificationsCount - unreadFilteredNotificationsCount
      : unreadFilteredNotificationsCount;

    return (
      <PopoverMenu
        hasArrow={false}
        transitionDuration={0}
        hoverCloseDelay={0}
        trigger={
          <Button
            class="toggle"
            style="padding: 8px; display: flex;"
            intent={unreadNotificationsCount > 0 ? 'primary' : undefined}
            label={
              <>
                {unreadNotificationsCount === 0 ? (
                  <CWIcon iconName="bell" style="display: flex;" />
                ) : (
                  <span>
                    {unreadNotificationsCount > 9
                      ? '∞'
                      : unreadNotificationsCount}
                  </span>
                )}
              </>
            }
            size={small ? 'sm' : 'default'}
            compact={true}
          />
        }
        position="bottom-end"
        closeOnContentClick={true}
        closeOnOutsideClick={true}
        class="NotificationsMenu"
        content={
          <>
            <div class="NotificationsMenuHeader">
              <Button
                label={
                  discussionNotificationsCount
                    ? `Discussions (${discussionNotificationsCount})`
                    : 'Discussions'
                }
                active={!this.selectedChainEvents}
                onclick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  this.selectedChainEvents = false;
                }}
              />
              <Button
                label={
                  chainNotificationsCount
                    ? `Chain events (${chainNotificationsCount})`
                    : 'Chain events'
                }
                active={!!this.selectedChainEvents}
                onclick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  this.selectedChainEvents = true;
                }}
              />
            </div>
            <div class="notification-list">
              {sortedFilteredNotifications.length > 0 ? (
                <Infinite
                  maxPages={1} // prevents rollover/repeat
                  pageData={() =>
                    sortedFilteredNotifications.slice(0, MAX_NOTIFS)
                  } // limit the number of rows shown here
                  key={
                    (this.selectedChainEvents ? 'chain-' : 'discussion-') +
                    sortedFilteredNotifications.length
                  }
                  item={(data) => {
                    return m(NotificationRow, { notifications: data });
                  }}
                />
              ) : this.selectedChainEvents ? (
                'No chain notifications'
              ) : (
                'No discussion notifications'
              )}
            </div>
            <NotificationsMenuFooter
              showingChainNotifications={this.selectedChainEvents}
            />
          </>
        }
      />
    );
  }
}
