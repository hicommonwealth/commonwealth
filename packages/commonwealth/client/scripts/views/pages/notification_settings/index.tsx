/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import moment from 'moment';

import 'pages/notification_settings/index.scss';

import app from 'state';
import { modelFromServer } from 'models/NotificationSubscription';
import { AddressInfo, NotificationSubscription } from 'models';
import { notifyError } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import { PageLoading } from '../loading';
import ErrorPage from '../error';
import { BreadcrumbsTitleTag } from '../../components/breadcrumbs_title_tag';
import { CWText } from '../../components/component_kit/cw_text';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWCollapsible } from '../../components/component_kit/cw_collapsible';
import { bundleSubs } from './helpers';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import User from '../../components/widgets/user';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';

class SubscriptionRowText
  implements m.ClassComponent<{ subscription: NotificationSubscription }>
{
  view(vnode) {
    const { subscription } = vnode.attrs;
    return (
      <div class="icon-and-text-container">
        <CWIcon iconName="feedback" iconSize="small" />
        <div class="title-and-body-container">
          {subscription.Thread && (
            <CWText type="b2" fontWeight="bold" noWrap>
              {renderQuillTextBody(subscription.Thread.title, {
                collapse: true,
                hideFormatting: true,
              })}
            </CWText>
          )}
          {subscription.Thread && (
            <CWText type="caption" className="subscription-body-text" noWrap>
              {renderQuillTextBody(subscription.Thread.body, {
                collapse: true,
                hideFormatting: true,
              })}
            </CWText>
          )}
          {subscription.Comment && (
            <div class="comment-header-row">
              <CWText type="b2" fontWeight="bold">
                {m(User, {
                  hideAvatar: true,
                  user: new AddressInfo(
                    null,
                    subscription.Comment.author,
                    subscription.Comment.chain,
                    null
                  ),
                })}
              </CWText>
              <CWText type="b2" className="attribution-text">
                's comment
              </CWText>
            </div>
          )}
          <CWText type="caption" className="subscription-body-text" noWrap>
            {subscription.Comment &&
              renderQuillTextBody(subscription.Comment.text, {
                collapse: true,
                hideFormatting: true,
              })}
          </CWText>
        </div>
      </div>
    );
  }
}

class SubscriptionRowMenu
  implements m.ClassComponent<{ subscription: NotificationSubscription }>
{
  view(vnode) {
    const { subscription } = vnode.attrs;
    return (
      <CWPopoverMenu
        trigger={<CWIconButton iconName="dotsVertical" />}
        popoverMenuItems={[
          {
            label: 'Mute Thread',
            iconName: 'mute',
            onclick: () => console.log('mute thread clicked'),
          },
          { type: 'divider' },
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

class NotificationSettingsPage implements m.ClassComponent {
  private subscriptions: NotificationSubscription[];

  async oninit() {
    if (!app.isLoggedIn()) {
      notifyError('Must be logged in to configure notifications');
      m.route.set('/');
    }

    this.subscriptions = [];

    $.get(`${app.serverUrl()}/viewSubscriptions`, {
      jwt: app.user.jwt,
    }).then(
      (result) => {
        result.result.forEach((sub) =>
          this.subscriptions.push(modelFromServer(sub))
        );
        m.redraw();
      },
      () => {
        notifyError('Could not load notification settings');
        m.route.set('/');
      }
    );
  }

  view() {
    if (!app.loginStatusLoaded()) {
      return (
        <PageLoading
          title={<BreadcrumbsTitleTag title="Notification Settings" />}
        />
      );
    } else if (!app.isLoggedIn()) {
      return (
        <ErrorPage
          message="This page requires you to be logged in"
          title={<BreadcrumbsTitleTag title="Notification Settings" />}
        />
      );
    } else if (this.subscriptions.length < 1) {
      return (
        <PageLoading
          title={<BreadcrumbsTitleTag title="Notification Settings" />}
        />
      );
    }

    const bundledSubs = bundleSubs(this.subscriptions);

    return (
      <Sublayout title={<BreadcrumbsTitleTag title="Notification Settings" />}>
        <div class="NotificationSettingsPage">
          <CWText type="h3" fontWeight="semiBold" className="page-header-text">
            Notification Management
          </CWText>
          <CWText className="page-subheader-text">
            Notification settings for all new threads, comments, mentions,
            likes, and chain events in the following communities.
          </CWText>
          <div class="column-header-row">
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
          {Object.entries(bundledSubs).map(([k, v]) => {
            const chainInfo = app.config.chains.getById(k);

            return (
              <div class="notification-row">
                <CWCollapsible
                  headerContent={
                    <div class="notification-row-header">
                      <div className="left-content-container">
                        <div class="avatar-and-name">
                          <CWCommunityAvatar
                            size="medium"
                            community={chainInfo}
                          />
                          <CWText type="h5" fontWeight="medium">
                            {chainInfo.name}
                          </CWText>
                        </div>
                        <CWText type="b2" className="subscriptions-count-text">
                          {v.length} subscriptions
                        </CWText>
                      </div>
                      <CWCheckbox label="Receive Emails" />
                      <CWToggle />
                    </div>
                  }
                  collapsibleContent={
                    <div class="subscriptions-list-container">
                      <div class="subscriptions-list-header">
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
                      {v.map((sub) => {
                        const getUser = () => {
                          if (sub.Thread) {
                            return m(User, {
                              user: new AddressInfo(
                                null,
                                sub.Thread.author,
                                sub.Thread.chain,
                                null
                              ),
                            });
                          } else if (sub.Comment) {
                            return m(User, {
                              user: new AddressInfo(
                                null,
                                sub.Comment.author,
                                sub.Comment.chain,
                                null
                              ),
                            });
                          } else {
                            // return empty div to ensure that grid layout is correct
                            // even in the absence of a user
                            return <div />;
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
                          <>
                            <div class="subscription-row-desktop">
                              <SubscriptionRowText subscription={sub} />
                              <CWText type="b2">{getTimeStamp()}</CWText>
                              {getUser()}
                              <SubscriptionRowMenu subscription={sub} />
                            </div>
                            <div class="subscription-row-mobile">
                              <div class="subscription-row-mobile-top">
                                <SubscriptionRowText subscription={sub} />
                                <SubscriptionRowMenu subscription={sub} />
                              </div>
                              <div class="subscription-row-mobile-bottom">
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
                          </>
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
  }
}

export default NotificationSettingsPage;
