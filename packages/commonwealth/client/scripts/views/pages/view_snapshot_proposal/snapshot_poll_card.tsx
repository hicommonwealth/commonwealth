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
      timeRemaining,
      tokenSymbol,
      votedFor,
      tooltipErrorMessage,
      isPreview
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
        <div class="poll-voting-section">
          {!this.hasVoted && !pollEnded && !isPreview && (
            <>
              <PollOptions
                multiSelect={false}
                voteInformation={this.localVoteInformation}
                selectedOptions={this.selectedOptions}
                disableVoteOptions={disableVoteButton}
              />
              <CastVoteSection
                disableVoteButton={
                  disableVoteButton || this.selectedOptions.length === 0
                }
                timeRemaining={timeRemaining}
                tooltipErrorMessage={tooltipErrorMessage}
                onVoteCast={castVote}
              />
            </>
          )}
          {(this.hasVoted || pollEnded) && (
            <VoteDisplay
              timeRemaining={timeRemaining}
              voteDirectionString={this.voteDirectionString}
              pollEnded={pollEnded}
              voteInformation={this.localVoteInformation}
            />
          )}
        </div>
        <ResultsSection
          resultString={resultString}
          onResultsClick={null}
          tokenSymbol={tokenSymbol}
          voteInformation={this.localVoteInformation}
          pollEnded={pollEnded}
          totalVoteCount={this.totalVoteCount}
          votedFor={votedFor}
          isPreview={isPreview}
        />
      </CWCard>
    );
  }
}
