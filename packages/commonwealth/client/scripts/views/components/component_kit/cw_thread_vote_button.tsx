/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_thread_vote_button.scss';

import { formatNumberShort } from 'adapters/currency';
import { CWText } from './cw_text';
import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';
import { getClasses } from './helpers';

type ThreadVoteButtonAttrs = {
  updateVoteCount: (newCount: number) => void;
  voteCount: number;
};

export class CWThreadVoteButton
  implements m.ClassComponent<ThreadVoteButtonAttrs>
{
  private isHoveringUpvote: boolean;
  private isHoveringDownvote: boolean;
  private initialVoteCount: number;

  oninit(vnode) {
    this.initialVoteCount = vnode.attrs.voteCount;
  }

  view(vnode) {
    const { updateVoteCount, voteCount } = vnode.attrs;

    const handleVoteChange = (newCount: number) => {
      updateVoteCount(newCount);
    };

    return (
      <div
        class={getClasses<{
          isHoveringUpvote: boolean;
          isHoveringDownvote: boolean;
          hasUpvoted: boolean;
          hasDownvoted: boolean;
        }>(
          {
            isHoveringUpvote: this.isHoveringUpvote,
            isHoveringDownvote: this.isHoveringDownvote,
            hasUpvoted: voteCount === this.initialVoteCount + 1,
            hasDownvoted: voteCount === this.initialVoteCount - 1,
          },
          ComponentType.ThreadVoteButton
        )}
      >
        <CWIcon
          iconName="upvote"
          iconSize="small"
          onclick={() => {
            voteCount === this.initialVoteCount + 1
              ? handleVoteChange(this.initialVoteCount)
              : handleVoteChange(voteCount + 1);
          }}
          className="upvote-button"
          onmouseenter={() => {
            this.isHoveringUpvote = true;
          }}
          onmouseleave={() => {
            this.isHoveringUpvote = false;
          }}
        />
        <CWText
          type="caption"
          fontWeight="medium"
          className="vote-count"
          title={voteCount}
        >
          {formatNumberShort(voteCount)}
        </CWText>
        <CWIcon
          iconName="downvote"
          iconSize="small"
          onclick={() => {
            voteCount === this.initialVoteCount - 1
              ? handleVoteChange(this.initialVoteCount)
              : handleVoteChange(voteCount - 1);
          }}
          onmouseenter={() => {
            this.isHoveringDownvote = true;
          }}
          onmouseleave={() => {
            this.isHoveringDownvote = false;
          }}
          className="downvote-button"
        />
      </div>
    );
  }
}
