import { capitalize } from 'lodash';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import useForceRerender from '../../../hooks/useForceRerender';
import AddressInfo from '../../../models/AddressInfo';
import app from '../../../state/index';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { Modal } from '../../components/component_kit/cw_modal';
import { CWText } from '../../components/component_kit/cw_text';
import {
  buildVoteDirectionString,
  CastVoteSection,
  PollOptions,
  ResultsSection,
  VoteDisplay,
  VoteInformation,
} from '../../components/poll_card';
import { User } from '../../components/user/user';
import { ConfirmSnapshotVoteModal } from '../../modals/confirm_snapshot_vote_modal';
import {
  SnapshotInfoLinkRow,
  SnapshotInfoRow,
} from '../view_snapshot_proposal/snapshot_information_card';
import {
  SnapshotPollCard,
  SnapshotPollCardProps,
} from '../view_snapshot_proposal/snapshot_poll_card';
import { SnapshotThreadLink } from './proposal_header_links';

export const ProposalPollCardContainer = (
  props: SnapshotProposalCardsProps
) => {
  const {
    activeUserAddress,
    identifier,
    proposal,
    space,
    totals,
    votes,
    validatedAgainstStrategies,
    totalScore,
    loadVotes,
  } = props;

  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [choice, setChoice] = React.useState<string>();

  const isActive =
    proposal &&
    moment(+proposal.start * 1000) <= moment() &&
    moment(+proposal.end * 1000) > moment();

  const [userVote, setUserVote] = useState(
    proposal.choices[
      votes.find((vote) => {
        return vote.voter === activeUserAddress;
      })?.choice - 1
    ]
  );
  const [hasVoted, setHasVoted] = useState(userVote !== undefined);

  const voteErrorText = !validatedAgainstStrategies
    ? VotingError.NOT_VALIDATED
    : hasVoted
    ? VotingError.ALREADY_VOTED
    : null;

  const timeRemaining = useMemo(() => {
    return calculateTimeRemaining(proposal);
  }, [proposal]);

  const voteInformation = useMemo(() => {
    if (!proposal) {
      return [];
    }
    const { choices } = proposal;
    const voteInfo = [];
    for (let i = 0; i < choices.length; i++) {
      const totalVotes = votes
        .filter((vote) => vote.choice === i + 1)
        .reduce((sum, vote) => sum + vote.balance, 0);
      voteInfo.push({
        label: choices[i],
        value: choices[i],
        voteCount: totalVotes,
      });
    }
    return voteInfo;
  }, [proposal, votes]);

  useEffect(() => {
    if (choice) {
      setIsModalOpen(true);
    }
  }, [choice]);

  return (
    <CWContentPageCard
      header={'Snapshot Vote'}
      content={
        <>
          <ProposalPollCard
            pollEnded={!isActive}
            hasVoted={hasVoted}
            votedFor={hasVoted ? userVote : ''}
            disableVoteButton={voteErrorText !== null}
            proposalTitle={proposal.title}
            timeRemaining={timeRemaining}
            totalVoteCount={totals.sumOfResultsBalance}
            voteInformation={voteInformation}
            onSnapshotVoteCast={async (_choice) => {
              setChoice(_choice);
            }}
            onVoteCast={async () => {
              setIsModalOpen(false);
            }}
            incrementalVoteCast={totalScore}
            tooltipErrorMessage={voteErrorText}
            isPreview={false}
          />
          <Modal
            content={
              <ConfirmSnapshotVoteModal
                space={space}
                proposal={proposal}
                id={identifier}
                selectedChoice={proposal?.choices.indexOf(choice).toString()}
                totalScore={totalScore}
                scores={scores}
                snapshot={proposal.snapshot}
                successCallback={async () => {
                  await loadVotes();
                  setHasVoted(true);
                  setUserVote(choice);
                }}
                onModalClose={() => setIsModalOpen(false)}
              />
            }
            onClose={() => setIsModalOpen(false)}
            open={isModalOpen}
          />
        </>
      }
    ></CWContentPageCard>
  );
};

const ProposalPollCard = (props: SnapshotPollCardProps) => {
  const {
    disableVoteButton = false,
    hasVoted,
    incrementalVoteCast,
    isPreview,
    onVoteCast,
    onSnapshotVoteCast,
    pollEnded,
    proposalTitle,
    timeRemaining,
    tooltipErrorMessage,
    totalVoteCount,
    votedFor,
    voteInformation,
  } = props;

  const [internalHasVoted, setInternalHasVoted] =
    React.useState<boolean>(hasVoted);
  const [selectedOptions, setSelectedOptions] = React.useState<Array<string>>(
    [] // is never updated?
  );
  const [internalTotalVoteCount, setInternalTotalVoteCount] =
    React.useState<number>(totalVoteCount);
  const [voteDirectionString, setVoteDirectionString] = React.useState<string>(
    votedFor ? buildVoteDirectionString(votedFor) : ''
  );
  const [internalVoteInformation, setInternalVoteInformation] =
    React.useState<Array<VoteInformation>>(voteInformation);

  const resultString = 'Results';

  const castVote = () => {
    setVoteDirectionString(buildVoteDirectionString(selectedOptions[0]));
    onSnapshotVoteCast(selectedOptions[0]);
  };

  useEffect(() => {
    if (hasVoted) {
      setInternalHasVoted(true);
    }
  }, [hasVoted]);

  useEffect(() => {
    if (votedFor) {
      buildVoteDirectionString(votedFor);
    }
  }, [votedFor]);

  useEffect(() => {
    setInternalTotalVoteCount(totalVoteCount);
  }, [totalVoteCount]);

  useEffect(() => {
    setInternalVoteInformation(voteInformation);
  }, [voteInformation]);

  return (
    <CWCard className="PollCard">
      <div className="poll-title-section">
        <CWText type="b2" className="poll-title-text">
          {proposalTitle}
        </CWText>
      </div>

      <div className="poll-voting-section">
        {!internalHasVoted && !pollEnded && !isPreview && (
          <>
            <PollOptions
              multiSelect={false}
              voteInformation={internalVoteInformation}
              selectedOptions={selectedOptions}
              disableVoteOptions={disableVoteButton}
              setSelectedOptions={setSelectedOptions}
            />
            <CastVoteSection
              disableVoteButton={
                disableVoteButton || selectedOptions.length === 0
              }
              timeRemaining={timeRemaining}
              tooltipErrorMessage={tooltipErrorMessage}
              onVoteCast={castVote}
            />
          </>
        )}
        {((internalHasVoted && !isPreview) || pollEnded) && (
          <VoteDisplay
            timeRemaining={timeRemaining}
            voteDirectionString={voteDirectionString}
            pollEnded={pollEnded}
            voteInformation={internalVoteInformation}
          />
        )}
      </div>
      <ResultsSection
        resultString={resultString}
        onResultsClick={null}
        voteInformation={internalVoteInformation}
        pollEnded={pollEnded}
        totalVoteCount={internalTotalVoteCount}
        votedFor={votedFor}
        isPreview={isPreview}
      />
    </CWCard>
  );
};

const ProposalVotes = (proposal) => {
  const forceRerender = useForceRerender();

  const votes = proposal.getVotes();

  useEffect(() => {
    app.proposalEmitter.on('redraw', forceRerender);

    return () => {
      app.proposalEmitter.removeAllListeners();
    };
  }, [forceRerender]);
};
