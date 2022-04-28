import m from 'mithril';
import moment from 'moment';
import { Button } from 'construct-ui';

import 'pages/discussions/index.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import Listing from 'views/pages/listing';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import ProposalRow from './proposal_row';
import { PageLoading } from '../loading';

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

enum SnapshotProposalFilter {
  Core = 'Core',
  Community = 'Community',
  Active = 'Active',
  Ended = 'Ended',
}

const SnapshotProposalStagesBar: m.Component<
  {
    selected: SnapshotProposalFilter;
    onChangeFilter: (value: SnapshotProposalFilter) => void;
  },
  {}
> = {
  view: (vnode) => {
    return m('.DiscussionFilterBar', [
      Object.values(SnapshotProposalFilter).map(
        (option: SnapshotProposalFilter) =>
          m(Button, {
            rounded: true,
            compact: true,
            size: 'sm',
            disabled:
              option === SnapshotProposalFilter.Core ||
              option === SnapshotProposalFilter.Community,
            class: `discussions-stage ${
              vnode.attrs.selected === option ? 'active' : ''
            }`,
            onclick: (e) => {
              e.preventDefault();
              vnode.attrs.onChangeFilter(option);
            },
            label: option,
          })
      ),
    ]);
  },
};

const SnapshotProposalsPage: m.Component<
  { topic?: string; snapshotId: string },
  {
    lookback?: { [community: string]: moment.Moment };
    postsDepleted: { [community: string]: boolean };
    topicInitialized: { [community: string]: boolean };
    lastSubpage: string;
    lastVisitedUpdated?: boolean;
    onscroll: any;
    selectedFilter: SnapshotProposalFilter;
  }
> = {
  oninit: (vnode) => {
    vnode.state.selectedFilter = SnapshotProposalFilter.Active;
  },

  view: (vnode) => {
    const { selectedFilter } = vnode.state;
    const { snapshotId } = vnode.attrs;

    if (!app.snapshot.initialized || app.snapshot?.space?.id != snapshotId) {
      app.snapshot.init(snapshotId).then(() => {
        m.redraw();
      });

      return m(PageLoading);
    }

    const checkProposalByFilter = (
      proposal: SnapshotProposal,
      option: SnapshotProposalFilter
    ) => {
      switch (option) {
        case SnapshotProposalFilter.Core:
        case SnapshotProposalFilter.Community:
          return true;
        case SnapshotProposalFilter.Active:
          return moment(+proposal.end * 1000) >= moment();
        case SnapshotProposalFilter.Ended:
          return moment(+proposal.end * 1000) < moment();
        default:
          break;
      }
      return true;
    };

    const proposals = app.snapshot.proposals.filter(
      (proposal: SnapshotProposal) =>
        checkProposalByFilter(proposal, selectedFilter)
    );

    const onChangeFilter = (value: SnapshotProposalFilter) => {
      vnode.state.selectedFilter = value;
    };

    return m(
      Sublayout,
      {
        title: 'Proposals',
        description: '',
        showNewProposalButton: true,
      },
      [
        app.chain && [
          m('.DiscussionsPage', [
            m(SnapshotProposalStagesBar, {
              selected: selectedFilter,
              onChangeFilter,
            }),
            m(Listing, {
              content: [
                m(
                  '.discussion-group-wrap',
                  proposals.length > 0
                    ? proposals.map((proposal) =>
                        m(ProposalRow, { snapshotId, proposal })
                      )
                    : m(
                        '.no-proposals',
                        `No ${vnode.state.selectedFilter} proposals found.`
                      )
                ),
              ],
            }),
          ]),
        ],
      ]
    );
  },
};

export default SnapshotProposalsPage;
