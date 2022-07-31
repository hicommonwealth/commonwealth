/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import { Button } from 'construct-ui';

import 'pages/snapshot_proposals.scss';
import 'pages/discussions/discussion_filter_bar.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { MixpanelSnapshotEvents } from 'analytics/types';

import { SnapshotProposal } from 'helpers/snapshot_utils';
import { PageLoading } from '../loading';
import { SnapshotProposalCard } from './snapshot_proposal_card';
import { CardsCollection } from '../../components/cards_collection';
import { mixpanelBrowserTrack } from '../../../helpers/mixpanel_browser_util';

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

enum SnapshotProposalFilter {
  Core = 'Core',
  Community = 'Community',
  Active = 'Active',
  Ended = 'Ended',
}

class SnapshotProposalStagesBar
  implements
    m.Component<{
      selected: SnapshotProposalFilter;
      onChangeFilter: (value: SnapshotProposalFilter) => void;
    }>
{
  view(vnode) {
    return (
      <div class="DiscussionFilterBar">
        {Object.values(SnapshotProposalFilter).map(
          (option: SnapshotProposalFilter) => (
            <Button
              rounded={true}
              compact={true}
              size="sm"
              disabled={
                option === SnapshotProposalFilter.Core ||
                option === SnapshotProposalFilter.Community
              }
              class={`discussions-stage ${
                vnode.attrs.selected === option ? 'active' : ''
              }`}
              onclick={(e) => {
                e.preventDefault();
                vnode.attrs.onChangeFilter(option);
              }}
              label={option}
            />
          )
        )}
      </div>
    );
  }
}

class SnapshotProposalsPage
  implements m.ClassComponent<{ topic?: string; snapshotId: string }>
{
  private selectedFilter: SnapshotProposalFilter;

  oncreate() {
    mixpanelBrowserTrack({
      event: MixpanelSnapshotEvents.SNAPSHOT_PAGE_VISIT,
      isCustomDomain: app.isCustomDomain(),
    });
  }

  oninit() {
    this.selectedFilter = SnapshotProposalFilter.Active;
  }

  view(vnode) {
    const { selectedFilter } = this;
    const { snapshotId } = vnode.attrs;

    if (!app.snapshot.initialized || app.snapshot?.space?.id !== snapshotId) {
      app.snapshot.init(snapshotId).then(() => {
        m.redraw();
      });

      return <PageLoading />;
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
      this.selectedFilter = value;
    };

    return (
      <Sublayout title="Proposals" showNewProposalButton={true}>
        {app.chain && (
          <div class="SnapshotProposalsPage">
            <SnapshotProposalStagesBar
              selected={selectedFilter}
              onChangeFilter={onChangeFilter}
            />
            <CardsCollection
              content={
                <>
                  {proposals.length > 0 ? (
                    proposals.map((proposal) => (
                      <SnapshotProposalCard
                        snapshotId={snapshotId}
                        proposal={proposal}
                      />
                    ))
                  ) : (
                    <div class="no-proposals">
                      No {this.selectedFilter.toLowerCase()} proposals found.
                    </div>
                  )}
                </>
              }
            />
          </div>
        )}
      </Sublayout>
    );
  }
}

export default SnapshotProposalsPage;
