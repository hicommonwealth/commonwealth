/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_vote_button.scss';

import { CWText } from './cw_text';
import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';
import { getClasses } from './helpers';

export type PreviousVote = 'previousUpvote' | 'previousDownvote';

type VoteButtonAttrs = {
  onDownvote: () => void;
  onUpvote: () => void;
  previousVote: PreviousVote;
  voteCount: number;
};

export class CWVoteButton implements m.ClassComponent<VoteButtonAttrs> {
  private isHoveringUpvote: boolean;
  private isHoveringDownvote: boolean;

  view(vnode) {
    const { onDownvote, onUpvote, previousVote, voteCount } = vnode.attrs;

    return (
      <div
        class={getClasses<{
          isHoveringUpvote: boolean;
          isHoveringDownvote: boolean;
          previousVote: PreviousVote;
        }>(
          {
            isHoveringUpvote: this.isHoveringUpvote,
            isHoveringDownvote: this.isHoveringDownvote,
            previousVote,
          },
          ComponentType.VoteButton
        )}
      >
        <CWIcon
          iconName="upvote"
          iconSize="small"
          onclick={previousVote === 'previousUpvote' ? undefined : onUpvote}
          className={getClasses<{ previousUpvote: boolean }>(
            { previousUpvote: previousVote === 'previousUpvote' },
            'upvote-button'
          )}
          onmouseenter={() => {
            this.isHoveringUpvote = true;
          }}
          onmouseleave={() => {
            this.isHoveringUpvote = false;
          }}
        />
        <CWText type="caption" fontWeight="medium" className="vote-count">
          {voteCount}
        </CWText>
        <CWIcon
          iconName="downvote"
          iconSize="small"
          onclick={previousVote === 'previousDownvote' ? undefined : onDownvote}
          onmouseenter={() => {
            this.isHoveringDownvote = true;
          }}
          onmouseleave={() => {
            this.isHoveringDownvote = false;
          }}
          className={getClasses<{ previousDownvote: boolean }>(
            { previousDownvote: previousVote === 'previousDownvote' },
            'downvote-button'
          )}
        />
      </div>
    );
  }
}
