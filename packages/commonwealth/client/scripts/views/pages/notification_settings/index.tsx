/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'pages/notification_settings/index.scss';

import app from 'state';
import { NotificationSubscription } from 'models';
import { notifyError } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
// import { PageLoading } from 'views/pages/loading';
import { BreadcrumbsTitleTag } from '../../components/breadcrumbs_title_tag';
import { CWText } from '../../components/component_kit/cw_text';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
// import ErrorPage from '../error';

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
        result.result.forEach((sub) => {
          this.subscriptions.push(NotificationSubscription.fromJSON(sub));
        });
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
          <CWText fontWeight="semiBold">subscriptions</CWText>
          {this.subscriptions.map((s) => {
            const chainInfo = app.config.chains.getById(s.Chain);

            console.log(chainInfo);

            return (
              <div class="notification-row">
                <CWText type="h5" fontWeight="medium">
                  {chainInfo.name}
                </CWText>
                <CWCommunityAvatar size="medium" community={chainInfo} />
                <CWCheckbox label="Email" />
              </div>
            );
          })}
        </div>
      </Sublayout>
    );
  }
}

export default NotificationSettingsPage;
