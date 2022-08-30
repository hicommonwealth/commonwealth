/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import moment from 'moment';

import 'pages/notification_settings/index.scss';

import app from 'state';
import { formatTimestamp } from 'helpers';
import { modelFromServer } from 'models/NotificationSubscription';
import { NotificationSubscription } from 'models';
import { notifyError } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
// import { PageLoading } from '../loading';
// import ErrorPage from '../error';
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
    // console.log(this.subscriptions);

    // if (!app.loginStatusLoaded()) {
    //   <PageLoading
    //     title={<BreadcrumbsTitleTag title="Notification Settings" />}
    //   />;
    // }
    // if (!app.isLoggedIn()) {
    //   <ErrorPage
    //     message="This page requires you to be logged in"
    //     title={<BreadcrumbsTitleTag title="Notification Settings" />}
    //   />;
    // }
    // } else if (this.subscriptions.length < 1) {
    //   <PageLoading
    //     title={<BreadcrumbsTitleTag title="Notification Settings" />}
    //   />;
    // }

    const bundledSubs = bundleSubs(this.subscriptions);

    return (
      <Sublayout title={<BreadcrumbsTitleTag title="Notification Settings" />}>
        <div class="NotificationSettingsPage">
          <CWText type="h3" fontWeight="semiBold">
            Notification Settings
          </CWText>
          <CWText>
            Notification settings for all new threads, comments, mentions,
            likes, and chain events in the following communities.
          </CWText>
          <div class="column-header-row">
            <CWText
              type="h5"
              fontWeight="medium"
              className="column-header-text"
            >
              Community
            </CWText>
            <CWText
              type="h5"
              fontWeight="medium"
              className="column-header-text"
            >
              Email Notifications
            </CWText>
            <CWText
              type="h5"
              fontWeight="medium"
              className="column-header-text"
            >
              In-App Notifications
            </CWText>
          </div>
          {this.subscriptions.length === 0
            ? null
            : Object.entries(bundledSubs).map(([k, v]) => {
                const chainInfo = app.config.chains.getById(k);

                return (
                  <div class="notification-row">
                    <CWCollapsible
                      headerContent={
                        <>
                          <CWCommunityAvatar
                            size="medium"
                            community={chainInfo}
                          />
                          <CWText type="h5" fontWeight="medium">
                            {chainInfo.name}
                          </CWText>
                          <CWText>{v.length} subscriptions</CWText>
                          <CWCheckbox label="Receive Emails" />
                          <CWToggle />
                        </>
                      }
                      collapsibleContent={
                        <div>
                          <CWText type="caption">Title</CWText>
                          <CWText type="caption">Published</CWText>
                          <CWText type="caption">Subscribed</CWText>
                          <CWText type="caption">Author</CWText>
                          {v.map((sub) => {
                            return (
                              <div>
                                <CWIcon iconName="feedback" iconSize="small" />
                                {/* if thread */}
                                {sub.Thread &&
                                  renderQuillTextBody(sub.Thread.title, {
                                    collapse: true,
                                  })}
                                {sub.Thread &&
                                  renderQuillTextBody(sub.Thread.body, {
                                    collapse: true,
                                  })}
                                {sub.Thread &&
                                  formatTimestamp(moment(sub.Thread.createdAt))}
                                {/* if comment */}
                                {sub.Comment &&
                                  renderQuillTextBody(sub.Comment.text, {
                                    collapse: true,
                                  })}
                                {sub.Comment &&
                                  formatTimestamp(
                                    moment(sub.Comment.created_at)
                                  )}
                                {formatTimestamp(moment(sub.createdAt))}
                                {/* {m(User, { user: ? })} */}
                                <CWPopoverMenu
                                  trigger={
                                    <CWIconButton iconName="dotsVertical" />
                                  }
                                  popoverMenuItems={[
                                    {
                                      label: 'Mute Thread',
                                      iconName: 'mute',
                                      onclick: () =>
                                        console.log('mute thread clicked'),
                                    },
                                    { type: 'divider' },
                                    {
                                      label: 'Unsubscribe',
                                      iconName: 'close',
                                      isSecondary: true,
                                      onclick: () =>
                                        console.log('unsubscribe clicked'),
                                    },
                                  ]}
                                />
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
  }
}

export default NotificationSettingsPage;
