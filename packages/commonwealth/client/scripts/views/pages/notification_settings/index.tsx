/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import {
  Button,
  Icons,
  ListItem,
  Table,
  Grid,
  Col,
  SelectList,
  RadioGroup,
} from 'construct-ui';

import 'pages/notification_settings/index.scss';

import app from 'state';
import {
  ChainNetwork,
  ProposalType,
  NotificationCategories,
} from 'common-common/src/types';
import { NotificationSubscription, ChainInfo } from 'models';
import { getProposalUrlPath } from 'identifiers';
import { link, pluralize } from 'helpers';
import { sortSubscriptions } from 'helpers/notifications';
import {
  EdgewareChainNotificationTypes,
  KusamaChainNotificationTypes,
  PolkadotChainNotificationTypes,
  KulupuChainNotificationTypes,
  DydxChainNotificationTypes,
} from 'helpers/chain_notification_types';
import { notifyError } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { BreadcrumbsTitleTag } from '../../components/breadcrumbs_title_tag';
import ErrorPage from '../error';
import { CWText } from '../../components/component_kit/cw_text';

const NOTIFICATION_TABLE_PRE_COPY = 'Off-chain discussion events';
const CHAIN_NOTIFICATION_TABLE_PRE_COPY = 'On-chain events';

const ALL_COMMUNITIES = 'All communities';

// left column - for identifying the notification type
const NEW_MENTIONS_LABEL = 'When someone mentions me';
const NEW_COLLABORATIONS_LABEL =
  'When someone adds me as an editor to a thread';
const NEW_THREADS_LABEL = 'When a thread is created';
const NEW_ACTIVITY_LABEL = 'When there is new activity on...';
const NEW_COMMENTS_LABEL_SUFFIX = '(new comments only)';
const NEW_REACTIONS_LABEL_SUFFIX = '(new reactions only)';

// right column - for selecting the notification frequency
const NOTIFICATION_ON_IMMEDIATE_EMAIL_OPTION = 'On (immediate)';
const NOTIFICATION_ON_OPTION = 'On';
const NOTIFICATION_ON_SOMETIMES_OPTION = 'Multiple';
const NOTIFICATION_OFF_OPTION = 'Off';

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

    this.subscriptions = [];
    this.communities = [];

    // initialize this.subscriptions
    $.get(`${app.serverUrl()}/viewSubscriptions`, {
      jwt: app.user.jwt,
    }).then(
      (result) => {
        this.subscriptions = [];

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

    const chains = _.uniq(app.config.chains.getAll());

    const chainsWithRole = app.user.roles.map((r) => r.chain_id);

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
          {/* <CWText>Community</CWText>
          <CWText>Method</CWText>
          <CWText>Time</CWText>
          <CWText>Status</CWText> */}
        </div>
      </Sublayout>
    );
  }
}

export default NotificationSettingsPage;
