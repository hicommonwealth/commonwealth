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

// TODO: stop when min is 1 i.e. all notifications have been retrieved
const MAX_NOTIFS = 40; // limit number of notifications shown
let minDiscussionNotification = 0;
let minChainEventsNotification = 0;
let init = false;

type NotificationsMenuFooterAttrs = { showingChainNotifications: boolean };

class NotificationsMenuFooter
  implements m.ClassComponent<NotificationsMenuFooterAttrs>
{
  view(vnode) {
    const { showingChainNotifications } = vnode.attrs;

    const discussionNotifications =
      app.user.notifications.discussionNotifications;
    const chainEventNotifications =
      app.user.notifications.chainEventNotifications;

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
        <Button
          label="Mark all read"
          onclick={(e) => {
            e.preventDefault();
            // e.stopPropagation();
            const typeNotif = showingChainNotifications
              ? chainEventNotifications
              : discussionNotifications;
            if (typeNotif.length < 1) return;
            app.user.notifications
              .markAsRead(typeNotif)
              ?.then(() => m.redraw());
          }}
        />
        <Button
          label="<"
          onclick={(e) => {
            e.preventDefault();
            // e.stopPropagation();
            if (
              showingChainNotifications &&
              minChainEventsNotification >= MAX_NOTIFS
            ) {
              minChainEventsNotification -= MAX_NOTIFS;
              console.log("# CE Notifications:", app.user.notifications.chainEventNotifications.length,
                "\trange:", minChainEventsNotification, "-", minChainEventsNotification + MAX_NOTIFS);
              m.redraw();
            } else if (minDiscussionNotification >= MAX_NOTIFS) {
              minDiscussionNotification -= MAX_NOTIFS;
              console.log("# Discussion Notifications:", app.user.notifications.discussionNotifications.length,
                "\trange:", minDiscussionNotification, "-", minDiscussionNotification + MAX_NOTIFS);
              m.redraw();
            }
          }}
        />
        <Button
          label=">"
          onclick={(e) => {
            if (!init) {
              init = true;
              minDiscussionNotification = app.user.notifications.discussionNotifications.length;
              minChainEventsNotification = app.user.notifications.chainEventNotifications.length;
            }

            e.preventDefault();
            // e.stopPropagation();
            console.log(app.user.notifications.chainEventNotifications.length, minChainEventsNotification, MAX_NOTIFS);
            if (showingChainNotifications) {
              if (app.user.notifications.chainEventNotifications.length < minChainEventsNotification + MAX_NOTIFS) {
                app.user.notifications.getChainEventNotifications().then(() => {
                  console.log(app.user.notifications.chainEventNotifications)
                  if (app.user.notifications.chainEventNotifications.length >= minChainEventsNotification + MAX_NOTIFS) {
                    minChainEventsNotification += MAX_NOTIFS;
                  }

                  console.log("# CE Notifications:", app.user.notifications.chainEventNotifications.length,
                    "\trange:", minChainEventsNotification, "-", minChainEventsNotification + MAX_NOTIFS);

                  m.redraw();
                });
              } else {
                if (app.user.notifications.chainEventNotifications.length >= minChainEventsNotification + MAX_NOTIFS) {
                  minChainEventsNotification += MAX_NOTIFS;
                }
              }
            } else {
              if (app.user.notifications.discussionNotifications.length < minDiscussionNotification + MAX_NOTIFS) {
                app.user.notifications.getDiscussionNotifications().then(() => {
                  if (app.user.notifications.discussionNotifications.length >= minDiscussionNotification + MAX_NOTIFS) {
                    minDiscussionNotification += MAX_NOTIFS;
                  }
                  console.log("# Discussion Notifications:", app.user.notifications.discussionNotifications.length,
                    "\trange:", minDiscussionNotification, "-", minDiscussionNotification + MAX_NOTIFS);
                  m.redraw();
                });
              } else {
                if (app.user.notifications.discussionNotifications.length >= minDiscussionNotification + MAX_NOTIFS) {
                  minDiscussionNotification += MAX_NOTIFS;
                }
              }
            }
          }}
        />
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

    // const notifications = app.user.notifications?.notifications || [];
    const discussionNotifications =
      app.user.notifications.discussionNotifications;
    const chainEventNotifications =
      app.user.notifications.chainEventNotifications;

    const unreadDiscussionNotifications = discussionNotifications.filter(
      (n) => !n.isRead
    );
    const unreadChainEventNotifications = chainEventNotifications.filter(
      (n) => !n.isRead
    );

    // const unreadNotificationsCount = unreadNotifications.length;

    // const unreadFilteredNotificationsCount = filteredNotifications.filter(
    //   (n) => !n.isRead
    // ).length;

    // const chainNotificationsCount = this.selectedChainEvents
    //   ? unreadFilteredNotificationsCount
    //   : unreadNotificationsCount - unreadFilteredNotificationsCount;
    //
    // const discussionNotificationsCount = this.selectedChainEvents
    //   ? unreadNotificationsCount - unreadFilteredNotificationsCount
    //   : unreadFilteredNotificationsCount;
    const unreadNotificationsCount = app.user.notifications.numUnread;

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
                  <CWIcon
                    iconName="bell"
                    iconSize="small"
                    style="display: flex;"
                  />
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
                  // discussionNotificationsCount
                  //   ? `Discussions (${discussionNotificationsCount})`
                  //   : 'Discussions'
                  'Discussions'
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
                  // chainNotificationsCount
                  //   ? `Chain events (${chainNotificationsCount})`
                  //   : 'Chain events'
                  'Chain events'
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
              {(() => {
                if (this.selectedChainEvents) {
                  if (chainEventNotifications.length > 0) {
                    return (
                      <Infinite
                        maxPages={1} // prevents rollover/repeat
                        pageData={() =>
                          chainEventNotifications.slice(
                            minChainEventsNotification,
                            minChainEventsNotification + MAX_NOTIFS
                          )
                        } // limit the number of rows shown here
                        key={
                          // (this.selectedChainEvents ? 'chain-' : 'discussion-') +
                          // sortedFilteredNotifications.length
                          'chain' // TODO: add the length/num of total chain-events once notifications and notifications read table are split
                        }
                        item={(data) => {
                          return m(NotificationRow, { notifications: [data] });
                        }}
                      />
                    );
                  } else return 'No chain notifications';
                } else {
                  if (discussionNotifications.length > 0) {
                    return (
                      <Infinite
                        maxPages={1} // prevents rollover/repeat
                        pageData={() =>
                          discussionNotifications.slice(
                            minDiscussionNotification,
                            minDiscussionNotification + MAX_NOTIFS
                          )
                        } // limit the number of rows shown here
                        key={
                          // (this.selectedChainEvents ? 'chain-' : 'discussion-') +
                          // sortedFilteredNotifications.length
                          'discussion' // TODO: add the length/num of total chain-events once notifications and notifications read table are split
                        }
                        item={(data) => {
                          return m(NotificationRow, { notifications: [data] });
                        }}
                      />
                    );
                  } else return 'No discussion notifications';
                }
              })()}
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
