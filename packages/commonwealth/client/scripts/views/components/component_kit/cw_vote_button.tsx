/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_vote_button.scss';

import { formatNumberShort } from 'adapters/currency';
import { CWText } from './cw_text';
import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';
import { getClasses } from './helpers';

type VoteButtonAttrs = {
  updateVoteCount: (newCount: number) => void;
  voteCount: number;
};

export class CWVoteButton implements m.ClassComponent<VoteButtonAttrs> {
  private isHoveringUpvote: boolean;
  private isHoveringDownvote: boolean;
  private voteArray: Array<number>;

  oninit(vnode) {
    const { voteCount } = vnode.attrs;

    this.voteArray = [voteCount - 1, voteCount, voteCount + 1];
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
            hasUpvoted: voteCount === this.voteArray[2],
            hasDownvoted: voteCount === this.voteArray[0],
          },
          ComponentType.VoteButton
        )}
      >
        <CWIcon
          iconName="upvote"
          iconSize="small"
          onclick={() => {
            voteCount === this.voteArray[2]
              ? handleVoteChange(this.voteArray[1])
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
            voteCount === this.voteArray[0]
              ? handleVoteChange(this.voteArray[1])
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
