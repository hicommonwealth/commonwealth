import 'pages/discussions/index.scss';

import $ from 'jquery';
import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import moment from 'moment-twitter';
import app from 'state';

import { Spinner, Button, ButtonGroup, Icons, Icon, PopoverMenu, MenuItem } from 'construct-ui';
import { pluralize, offchainThreadStageToLabel, externalLink } from 'helpers';
import { NodeInfo, CommunityInfo, OffchainThreadStage } from 'models';

import { updateLastVisited } from 'controllers/app/login';
import { notifyError } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import EmptyTopicPlaceholder, { EmptyStagePlaceholder } from 'views/components/empty_topic_placeholder';
import LoadingRow from 'views/components/loading_row';
import Listing from 'views/pages/listing';
import NewTopicModal from 'views/modals/new_topic_modal';
import EditTopicModal from 'views/modals/edit_topic_modal';
import CreateInviteModal from 'views/modals/create_invite_modal';

import { INITIAL_PAGE_SIZE } from 'controllers/server/threads';
// import PinnedListing from './pinned_listing';
import ProposalRow from './proposal_row';

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

const getLastSeenDivider = (hasText = true) => {
  return m('.LastSeenDivider', hasText ? [
    m('hr'),
    m('span', 'Last visit'),
    m('hr'),
  ] : [
    m('hr'),
  ]);
};

const SnapshotProposalStagesBar: m.Component<{}, {}> = {
  view: (vnode) => {
    return m('.DiscussionStagesBar.discussions-stages', [
      m(ButtonGroup, [
        m(Button, {
          rounded: true,
          compact: true,
          size: 'sm',
          class: 'discussions-stage',
          onclick: (e) => {
            e.preventDefault();
          },
          label: 'Core'
        }),
        m(Button, {
          rounded: true,
          compact: true,
          size: 'sm',
          class: 'discussions-stage',
          onclick: (e) => {
            e.preventDefault();
          },
          label: 'Community'
        }),
        m(Button, {
          rounded: true,
          compact: true,
          size: 'sm',
          class: 'discussions-stage',
          onclick: (e) => {
            e.preventDefault();
          },
          label: 'Active'
        }),
        m(Button, {
          rounded: true,
          compact: true,
          size: 'sm',
          class: 'discussions-stage',
          onclick: (e) => {
            e.preventDefault();
          },
          label: 'Pending'
        }),
        m(Button, {
          rounded: true,
          compact: true,
          size: 'sm',
          class: 'discussions-stage',
          onclick: (e) => {
            e.preventDefault();
          },
          label: 'Closed'
        }),
      ]),
    ]);
  }
};

const SnapshotProposalsPage: m.Component<{ topic?: string }, {
  lookback?: { [community: string]: moment.Moment} ;
  postsDepleted: { [community: string]: boolean };
  topicInitialized: { [community: string]: boolean };
  lastSubpage: string;
  lastVisitedUpdated?: boolean;
  onscroll: any;
}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'Snapshot Proposals Page',
      Scope: app.activeId(),
    });
  },

  oninit: (vnode) => {
    const snapshotId = app.chain?.meta.chain.snapshot;
    app.snapshot.fetchSnapshotProposals(snapshotId);
  },
  
  view: (vnode) => {
    let listing = [];
    const allProposals = app.snapshot.proposalStore.getAll();
    
    listing.push(m('.discussion-group-wrap', allProposals
        .map((proposal) => m(ProposalRow, { proposal }))));

    return m(Sublayout, {
      class: 'SnapshotProposalsPage',
      title: '',
      description: '',
      showNewProposalButton: true,
    }, [
      (app.chain || app.community) && [
        m('.discussions-main', [
          m(SnapshotProposalStagesBar, {}),
          m(Listing, { content: listing }),
        ])
      ]
    ]);
  }
};

export default SnapshotProposalsPage;
