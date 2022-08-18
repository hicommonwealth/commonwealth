/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';

import 'pages/notification_settings/index.scss';

import app from 'state';
import { NotificationSubscription, ChainInfo } from 'models';
import { notifyError } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { BreadcrumbsTitleTag } from '../../components/breadcrumbs_title_tag';
import ErrorPage from '../error';
import { CWText } from '../../components/component_kit/cw_text';

const ALL_COMMUNITIES = 'All communities';

class NotificationSettingsPage implements m.ClassComponent {
  private allCommunityIds: string[];
  private communities: ChainInfo[];
  private selectableCommunityIds: string[];
  private selectedCommunity: ChainInfo;
  private selectedCommunityId: string;
  private subscriptions: NotificationSubscription[];

  async oninit() {
    if (!app.isLoggedIn) {
      notifyError('Must be logged in to configure notifications');
      m.route.set('/');
    }

    // initialize this.subscriptions
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

    // initialize this.communities
    this.communities = [];
    const selectableCommunityIds = app.user.roles
      .filter((role) => role.chain_id)
      .map((r) => r.chain_id);
    this.communities = _.uniq(
      app.config.chains
        .getAll()
        .filter((c) => selectableCommunityIds.includes(c.id))
    );

    // initialize this.allCommunityIds
    this.allCommunityIds = [];
    _.uniq(app.config.chains.getAll()).forEach((c) =>
      this.allCommunityIds.push(c.id)
    );
    this.communities.forEach((c) => this.allCommunityIds.push(c.id));

    // initialize selectableCommunityIds
    this.selectableCommunityIds = [ALL_COMMUNITIES];
    this.communities.forEach((c) => this.selectableCommunityIds.push(c.name));
    const chainsWithRole = app.user.roles.map((r) => r.chain_id);
    const chains = _.uniq(app.config.chains.getAll());
    chains.forEach((c) => {
      if (chainsWithRole.includes(c.id))
        this.selectableCommunityIds.push(c.name);
    });
    this.selectableCommunityIds.sort();

    // initialize this.selectedCommunity, this.selectedCommunityId
    this.selectedCommunityId = ALL_COMMUNITIES;
    this.selectedCommunity = null;
  }

  view() {
    const {
      allCommunityIds,
      communities,
      selectableCommunityIds,
      selectedCommunity,
      selectedCommunityId,
      subscriptions,
    } = this;

    const chains = _.uniq(app.config.chains.getAll());

    if (!app.loginStatusLoaded()) {
      <PageLoading
        title={<BreadcrumbsTitleTag title="Notification Settings" />}
      />;
    } else if (!app.isLoggedIn()) {
      <ErrorPage
        message="This page requires you to be logged in"
        title={<BreadcrumbsTitleTag title="Notification Settings" />}
      />;
    } else if (subscriptions.length < 1) {
      <PageLoading
        title={<BreadcrumbsTitleTag title="Notification Settings" />}
      />;
    }

    console.log(allCommunityIds);

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
          {subscriptions.map((s) => (
            <div>{s.Chain}</div>
          ))}
          <CWText fontWeight="semiBold">communities</CWText>
          {communities.map((s) => (
            <div>{s.name}</div>
          ))}
        </div>
      </Sublayout>
    );
  }
}

export default NotificationSettingsPage;
