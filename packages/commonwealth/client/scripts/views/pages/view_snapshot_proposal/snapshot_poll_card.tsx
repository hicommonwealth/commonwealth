/* @jsx m */

import m from 'mithril';

import 'components/poll_card.scss';

import {
  buildVoteDirectionString,
  CastVoteSection,
  PollCardAttrs,
  PollOptions,
  ResultsSection,
  VoteDisplay,
  VoteInformation,
} from '../../components/poll_card';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWText } from '../../components/component_kit/cw_text';

export type SnapshotPollCardAttrs = Omit<
  PollCardAttrs,
  'multiSelect' | 'onResultsClick'
>;

export class SnapshotPollCard
  implements m.ClassComponent<SnapshotPollCardAttrs>
{
  private hasVoted: boolean;
  private selectedOptions: Array<string>;
  private totalVoteCount: number;
  private voteDirectionString: string;
  private localVoteInformation: Array<VoteInformation>;

  oninit(vnode) {
    // Initialize state which can change during the lifecycle of the component.
    this.hasVoted = vnode.attrs.hasVoted;
    this.voteDirectionString = vnode.attrs.votedFor
      ? buildVoteDirectionString(vnode.attrs.votedFor)
      : '';
    this.totalVoteCount = vnode.attrs.totalVoteCount;
    this.selectedOptions = [];
    this.localVoteInformation = vnode.attrs.voteInformation;
  }

  view(vnode) {
    const {
      disableVoteButton = false,
      incrementalVoteCast,
      onVoteCast,
      pollEnded,
      proposalTitle,
      timeRemainingString,
      tokenSymbol,
      votedFor,
    } = vnode.attrs;

    const resultString = 'Results';

    const castVote = async () => {
      await onVoteCast(this.selectedOptions[0], () => {
        if (!votedFor) {
          this.totalVoteCount += incrementalVoteCast;
        }
        this.voteDirectionString = buildVoteDirectionString(
          this.selectedOptions[0]
        );
        this.hasVoted = true;
        // Local vote information is updated here because it is not updated in the parent component in time
        this.localVoteInformation = this.localVoteInformation.map((option) => {
          if (option.label === this.selectedOptions[0]) {
            return {
              ...option,
              hasVoted: true,
              voteCount: option.voteCount + incrementalVoteCast,
            };
          } else {
            return option;
          }
        });
      });
      m.redraw();
    };

    return (
      <CWCard className="PollCard">
        <CWText type="b2" className="poll-title-text">
          {proposalTitle}
        </CWText>
        {!pollEnded && (
          <div class="poll-voting-section">
            {!this.hasVoted ? (
              <>
                <PollOptions
                  multiSelect={false}
                  voteInformation={this.localVoteInformation}
                  selectedOptions={this.selectedOptions}
                />
                <CastVoteSection
                  disableVoteButton={
                    disableVoteButton || this.selectedOptions.length === 0
                  }
                  timeRemainingString={timeRemainingString}
                  onVoteCast={castVote}
                />
              </>
            ) : (
              <VoteDisplay
                timeRemainingString={timeRemainingString}
                voteDirectionString={this.voteDirectionString}
              />
            )}
          </div>
        )}
        <ResultsSection
          resultString={resultString}
          onResultsClick={null}
          tokenSymbol={tokenSymbol}
          voteInformation={this.localVoteInformation}
          pollEnded={pollEnded}
          totalVoteCount={this.totalVoteCount}
        />
      </CWCard>
    );
  }
}
