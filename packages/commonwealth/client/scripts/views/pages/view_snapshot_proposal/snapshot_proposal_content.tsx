/* @jsx m */

import m from 'mithril';

import 'pages/snapshot/snapshot_proposal_content.scss';

import { SnapshotProposal, SnapshotProposalVote } from 'helpers/snapshot_utils';
import { CWText } from '../../components/component_kit/cw_text';
import {
  ActiveProposalPill,
  ClosedProposalPill,
} from '../../components/proposal_pills';
import { SnapshotVotesTable } from './snapshot_votes_table';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { MarkdownFormattedText } from '../../components/quill/markdown_formatted_text';
import { renderQuillTextBody } from '../../components/quill/helpers';

type SnapshotProposalContentAttrs = {
  proposal: SnapshotProposal;
  symbol: string;
  votes: SnapshotProposalVote[];
};

export class SnapshotProposalContent
  implements m.ClassComponent<SnapshotProposalContentAttrs>
{
  private votersListExpanded: boolean;

  oncreate() {
    this.votersListExpanded = false;
  }

  view(vnode) {
    const { proposal, votes, symbol } = vnode.attrs;

    const toggleExpandedVoterList = () => {
      this.votersListExpanded = !this.votersListExpanded;
      m.redraw();
    };

    const votersList = this.votersListExpanded ? votes : votes.slice(0, 10);

    return (
      <div class="SnapshotProposalContent">
        <div class="snapshot-proposal-content-header">
          <CWText type="h3" fontWeight="semiBold">
            {proposal.title}
          </CWText>
          {proposal.state === 'active' ? (
            <ActiveProposalPill proposalEnd={proposal.end} />
          ) : (
            <ClosedProposalPill proposalState={proposal.state} />
          )}
        </div>
        <CWDivider />
        {renderQuillTextBody(proposal.body, {})}
        {/* <MarkdownFormattedText doc={proposal.body} /> */}
        {votes.length > 0 && (
          <>
            <CWDivider />
            <SnapshotVotesTable
              choices={proposal.choices}
              symbol={symbol}
              toggleExpandedVoterList={toggleExpandedVoterList}
              voteCount={votes.length}
              votersList={votersList}
            />
          </>
        )}
      </div>
    );
  }
}
