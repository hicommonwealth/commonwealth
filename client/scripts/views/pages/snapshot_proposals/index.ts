import 'pages/discussions/index.scss';

import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import moment from 'moment';
import app from 'state';

import { Spinner, Button, ButtonGroup, Icons, Icon, PopoverMenu, MenuItem } from 'construct-ui';

import Sublayout from 'views/sublayout';
import Listing from 'views/pages/listing';

import ProposalRow from './proposal_row';

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

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

const SnapshotProposalsPage: m.Component<{ topic?: string, snapshotId: string }, {
  lookback?: { [community: string]: moment.Moment} ;
  postsDepleted: { [community: string]: boolean };
  topicInitialized: { [community: string]: boolean };
  lastSubpage: string;
  lastVisitedUpdated?: boolean;
  onscroll: any;
  allProposals: any;
  listing: any[]
}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'Snapshot Proposals Page',
      Scope: app.activeId(),
    });
    const snapshotId = vnode.attrs.snapshotId
    app.snapshot.fetchSnapshotProposals(snapshotId).then(response => {
      vnode.state.listing = app.snapshot.proposalStore.getAll()
      .map((proposal) => m(ProposalRow, { snapshotId, proposal }))

      m.redraw();
    });
  },

  oninit: (vnode) => {
    vnode.state.listing = [];
  },
  
  view: (vnode) => {
    let listing = [];
    listing.push(m('.discussion-group-wrap', vnode.state.listing));
    
    return m(Sublayout, {
      class: 'DiscussionsPage',
      title: 'Snapshot Proposals',
      description: '',
      showNewProposalButton: true,
    }, [
      (app.chain || app.community) && [
        m('.discussions-main', [
          m(SnapshotProposalStagesBar, {}),
          listing.length === 0
            ? m('.topic-loading-spinner-wrap', [ m(Spinner, { active: true, size: 'lg' }) ])
            : m(Listing, { content: listing }),
        ])
      ]
    ]);
  }
};

export default SnapshotProposalsPage;
