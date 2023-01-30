/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import type { Poll, Thread } from 'models';

import moment from 'moment';

import 'pages/view_thread/poll_cards.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { PollCard } from '../../components/poll_card';
import { OffchainVotingModal } from '../../modals/offchain_voting_modal';
import { PollEditorModal } from '../../modals/poll_editor_modal';
import { getPollTimestamp, handlePollVote } from './helpers';

type ThreadPollEditorCardAttrs = {
  thread: Thread;
  threadAlreadyHasPolling: boolean;
};

export class ThreadPollEditorCard extends ClassComponent<ThreadPollEditorCardAttrs> {
  view(vnode: ResultNode<ThreadPollEditorCardAttrs>) {
    const { thread, threadAlreadyHasPolling } = vnode.attrs;

    return (
      <CWContentPageCard
        header={`Add ${
          threadAlreadyHasPolling ? 'an' : 'another'
        } offchain poll to this
        thread?`}
        content={
          (
            <div className="PollEditorCard">
              <CWButton
                buttonType="mini-black"
                label="Create poll"
                onClick={(e) => {
                  e.preventDefault();
                  app.modals.create({
                    modal: PollEditorModal,
                    data: {
                      thread,
                    },
                  });
                }}
              />
            </div>
          ) as any
          // @ZAK @REACT ^ (fix to remove 'as any')
        }
      />
    );
  }
}

type ThreadPollCardAttrs = {
  poll: Poll;
};

export class ThreadPollCard extends ClassComponent<ThreadPollCardAttrs> {
  view(vnode: ResultNode<ThreadPollCardAttrs>) {
    const { poll } = vnode.attrs;

    return (
      <PollCard
        multiSelect={false}
        pollEnded={poll.endsAt && poll.endsAt?.isBefore(moment().utc())}
        hasVoted={
          app.user.activeAccount &&
          !!poll.getUserVote(
            app.user.activeAccount?.chain?.id,
            app.user.activeAccount?.address
          )
        }
        disableVoteButton={!app.user.activeAccount}
        votedFor={
          poll.getUserVote(
            app.user.activeAccount?.chain?.id,
            app.user.activeAccount?.address
          )?.option
        }
        proposalTitle={poll.prompt}
        timeRemaining={getPollTimestamp(
          poll,
          poll.endsAt && poll.endsAt?.isBefore(moment().utc())
        )}
        totalVoteCount={poll.votes?.length}
        voteInformation={poll.options.map((option) => {
          return {
            label: option,
            value: option,
            voteCount: poll.votes.filter((v) => v.option === option).length,
          };
        })}
        incrementalVoteCast={1}
        isPreview={false}
        tooltipErrorMessage={
          app.user.activeAccount
            ? null
            : 'You must join this community to vote.'
        }
        onVoteCast={(option, callback, isSelected) =>
          handlePollVote(poll, option, isSelected, callback)
        }
        onResultsClick={(e) => {
          e.preventDefault();
          if (poll.votes.length > 0) {
            app.modals.create({
              modal: OffchainVotingModal,
              data: { votes: poll.votes },
            });
          }
        }}
      />
    );
  }
}
