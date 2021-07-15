import 'pages/discussions/index.scss';

import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import moment from 'moment';
import app from 'state';

import { Spinner, Button, ButtonGroup } from 'construct-ui';

import Sublayout from 'views/sublayout';
import Listing from 'views/pages/listing';

import { SnapshotProposal } from 'client/scripts/models';
import ProposalRow from './proposal_row';

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

enum SnapshotProposalFilter {
  Core = 'Core',
  Community = 'Community',
  Active = 'Active',
  Ended = 'Ended',
}

const SnapshotProposalStagesBar: m.Component<{
  selected: SnapshotProposalFilter,
  onChangeFilter: (value: SnapshotProposalFilter) => void
}, {}> = {
  view: (vnode) => {
    return m('.DiscussionStagesBar.discussions-stages', [
      Object.values(SnapshotProposalFilter)
        .map((option: SnapshotProposalFilter) => m(Button, {
          rounded: true,
          compact: true,
          size: 'sm',
          class: `discussions-stage ${vnode.attrs.selected === option ? 'active' : ''}`,
          onclick: (e) => {
            e.preventDefault();
            vnode.attrs.onChangeFilter(option);
          },
          label: option
        }))
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
  loadingProposals: boolean;
  selectedFilter: SnapshotProposalFilter;
}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', {
      'Page Name': 'Snapshot Proposals Page',
      Scope: app.activeId(),
    });
    const snapshotId = vnode.attrs.snapshotId;
    app.snapshot.fetchSnapshotProposals(snapshotId).then((response) => {
      vnode.state.allProposals = app.snapshot.proposalStore.getAll();

      m.redraw();
    }).finally(() => {
      vnode.state.loadingProposals = false;
    });
  },

  oninit: (vnode) => {
    vnode.state.loadingProposals = true;
    vnode.state.allProposals = [];
    vnode.state.selectedFilter = SnapshotProposalFilter.Core;
  },

  view: (vnode) => {
    const { loadingProposals, allProposals, selectedFilter } = vnode.state;
    const { snapshotId } = vnode.attrs;

    if (loadingProposals) return m(Spinner, { active: true, fill: true });

    const checkProposalByFilter = (proposal: SnapshotProposal, option: SnapshotProposalFilter) => {
      switch (option) {
        case SnapshotProposalFilter.Core:
          return !proposal.private;
        case SnapshotProposalFilter.Community:
          return proposal.private;
        case SnapshotProposalFilter.Active:
          return moment(+proposal.end * 1000) < moment();
        case SnapshotProposalFilter.Ended:
          return moment(+proposal.end * 1000) >= moment();
        default:
          break;
      }
      return true;
    };

    const proposals = allProposals.filter((proposal: SnapshotProposal) => checkProposalByFilter(proposal, selectedFilter));

    const onChangeFilter = (value: SnapshotProposalFilter) => {
      vnode.state.selectedFilter = value;
    };

    return m(Sublayout, {
      class: 'DiscussionsPage',
      title: 'Proposals',
      description: '',
      showNewProposalButton: true,
    }, [
      (app.chain || app.community) && [
        m('.discussions-main', [
          m(SnapshotProposalStagesBar, { selected: selectedFilter, onChangeFilter }),
          m(Listing, {
            content: [
              m('.discussion-group-wrap', proposals.length > 0
                ? proposals.map((proposal) => m(ProposalRow, { snapshotId, proposal }))
                : m('.no-proposals', `No ${vnode.state.selectedFilter} proposals found.`))
            ]
          })
        ])
      ]
    ]);
  }
};

export default SnapshotProposalsPage;
