/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
// import Infinite from 'mithril-infinite';
// import { Button, PopoverMenu } from 'construct-ui';

import 'components/header/notifications_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import NotificationRow from '../components/notification_row';
import { CWCustomIcon } from '../components/component_kit/cw_icons/cw_custom_icon';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

const MAX_NOTIFS = 40;

export class NotificationsMenu extends ClassComponent {
  private init = false;
  private minChainEventsNotification = 0;
  private minDiscussionNotification = 0;
  private selectedChainEvents: boolean;
  private showingChainEventNotifications;
  private showingDiscussionNotifications;

  private _incrementAndRedraw(type: 'chain-event' | 'discussion') {
    if (type === 'chain-event') {
      if (
        app.user.notifications.chainEventNotifications.length >=
        this.minChainEventsNotification + MAX_NOTIFS
      )
        this.minChainEventsNotification += MAX_NOTIFS;
    } else if (type === 'discussion') {
      if (
        app.user.notifications.discussionNotifications.length >=
        this.minDiscussionNotification + MAX_NOTIFS
      )
        this.minDiscussionNotification += MAX_NOTIFS;
    }
    redraw();
  }

  private _nextPage(showingChainEvents: boolean) {
    if (showingChainEvents) {
      const numChainEventNotif =
        app.user.notifications.chainEventNotifications.length;
      if (numChainEventNotif < this.minChainEventsNotification + MAX_NOTIFS) {
        app.user.notifications.getChainEventNotifications().then(() => {
          this._incrementAndRedraw('chain-event');
        });
      } else this._incrementAndRedraw('chain-event');
    } else {
      const numDiscussionNotif =
        app.user.notifications.discussionNotifications.length;
      if (numDiscussionNotif < this.minDiscussionNotification + MAX_NOTIFS) {
        app.user.notifications.getDiscussionNotifications().then(() => {
          this._incrementAndRedraw('discussion');
        });
      } else this._incrementAndRedraw('discussion');
    }
  }

  private _previousPage(showingChainEvents: boolean) {
    if (showingChainEvents && this.minChainEventsNotification >= MAX_NOTIFS) {
      this.minChainEventsNotification -= MAX_NOTIFS;
    } else if (showingChainEvents && this.minChainEventsNotification !== 0) {
      this.minChainEventsNotification = 0;
    } else if (this.minDiscussionNotification >= MAX_NOTIFS) {
      this.minDiscussionNotification -= MAX_NOTIFS;
    } else if (this.minDiscussionNotification !== 0) {
      this.minDiscussionNotification = 0;
    }
    redraw();
  }

  view() {
    this.showingDiscussionNotifications =
      app.user.notifications.discussionNotifications.slice(
        this.minDiscussionNotification,
        this.minDiscussionNotification + MAX_NOTIFS
      );

    this.showingChainEventNotifications =
      app.user.notifications.chainEventNotifications.slice(
        this.minChainEventsNotification,
        this.minChainEventsNotification + MAX_NOTIFS
      );

    return (
      <div className="NotificationsMenu">
        <div className="NotificationsMenuHeader">
          {/* {m(Button, { // @TODO @REACT FIX ME
            label:
              // discussionNotificationsCount
              //   ? `Discussions (${discussionNotificationsCount})`
              //   : 'Discussions'
              'Discussions',
            active: !this.selectedChainEvents,
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.selectedChainEvents = false;
            },
          })}
          {render(Button, {
            label:
              // chainNotificationsCount
              //   ? `Chain events (${chainNotificationsCount})`
              //   : 'Chain events'
              'Chain events',
            active: !!this.selectedChainEvents,
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.selectedChainEvents = true; // @TODO @REACT FIX ME
            },
          })} */}
        </div>
        <div className="notification-list">
          {(() => {
            if (this.selectedChainEvents) {
              if (this.showingChainEventNotifications.length > 0) {
                return null; // @TODO @REACT FIX ME
                // return m(Infinite, { // @TODO @REACT FIX ME
                //   maxPages: 1, // prevents rollover/repeat
                //   pageData: () => this.showingChainEventNotifications, // limit the number of rows shown here
                //   pageKey: () =>
                //     `${this.minChainEventsNotification} - ${
                //       this.minChainEventsNotification + MAX_NOTIFS
                //     }`,
                //   key:
                //     // (this.selectedChainEvents ? 'chain-' : 'discussion-') +
                //     // sortedFilteredNotifications.length
                //     'chain',
                //   // TODO: add the length/num of total chain-events once
                //   // notifications and notifications read table are split
                //   item: (data) => m(NotificationRow, { notifications: [data] }),
                // });
              } else if (
                app.user.notifications.chainEventNotifications.length === 0
              )
                return 'No chain notifications';
              else return 'No more chain notifications';
            } else {
              if (this.showingDiscussionNotifications.length > 0) {
                return null; // @TODO @REACT FIX ME
                // return m(Infinite, { // @TODO @REACT FIX ME
                //   maxPages: 1, // prevents rollover/repeat
                //   pageData: () => this.showingDiscussionNotifications, // limit the number of rows shown here
                //   pageKey: () =>
                //     `${this.minDiscussionNotification} - ${
                //       this.minDiscussionNotification + MAX_NOTIFS
                //     }`,
                //   key:
                //     // (this.selectedChainEvents ? 'chain-' : 'discussion-') +
                //     // sortedFilteredNotifications.length
                //     'discussion',
                //   // TODO: add the length/num of total chain-events once
                //   // notifications and notifications read table are split
                //   item: (data) => m(NotificationRow, { notifications: [data] }),
                // });
              } else if (
                app.user.notifications.discussionNotifications.length === 0
              )
                return 'No discussion notifications';
              else return 'No more discussion notifications';
            }
          })()}
        </div>
        <div className="NotificationsMenuFooter">
          {/* {m(Button, { // @TODO @REACT FIX ME
            label: 'See all',
            onClick: () =>
              app.activeChainId()
                ? navigateToSubpage('/notifications')
                : setRoute('/notifications'),
          })}
          {render(Button, {
            label: 'Mark all read',
            onClick: (e) => {
              e.preventDefault();
              // e.stopPropagation();
              const typeNotif = this.selectedChainEvents
                ? this.showingChainEventNotifications
                : this.showingDiscussionNotifications;
              if (typeNotif.length < 1) return;
              app.user.notifications
                .markAsRead(typeNotif)
                ?.then(() => redraw());
            },
          })}
          {render(Button, {
            label: '<',
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              this._previousPage(this.selectedChainEvents);
            },
          })}
          {render(Button, {
            label: '>',
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              // necessary since page refresh loads the first set of notifications for both but the min may not be set
              if (!this.init) {
                this.init = true;
                this.minDiscussionNotification =
                  app.user.notifications.discussionNotifications.length;
                this.minChainEventsNotification =
                  app.user.notifications.chainEventNotifications.length;
              }
              this._nextPage(this.selectedChainEvents);
            },
          })} */}
        </div>
      </div>
    );
  }
}

export class NotificationsMenuPopover extends ClassComponent {
  view() {
    return null;
    // return m(PopoverMenu, {
    //   closeOnContentClick: true,
    //   closeOnOutsideClick: true,
    //   hasArrow: false,
    //   hoverCloseDelay: 0,
    //   position: 'bottom-end',
    //   transitionDuration: 0,
    //   trigger:
    //     app.user.notifications.numUnread > 0 ? (
    //       <div className="unreads-icon">
    //         <CWCustomIcon iconName="unreads" />
    //       </div>
    //     ) : (
    //       <CWIconButton iconButtonTheme="black" iconName="bell" />
    //     ),
    //   content: <NotificationsMenu />,
    // });
  }
}
