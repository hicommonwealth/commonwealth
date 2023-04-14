import { formatNumberShort } from 'adapters/currency';

import 'components/component_kit/cw_thread_vote_button.scss';
import React from 'react';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type ThreadVoteButtonProps = {
  updateVoteCount: (newCount: number) => void;
  voteCount: number;
};

export const CWThreadVoteButton = (props: ThreadVoteButtonProps) => {
  const [isHoveringUpvote, setIsHoveringUpvote] =
    React.useState<boolean>(false);
  const [isHoveringDownvote, setIsHoveringDownvote] =
    React.useState<boolean>(false);

  const { updateVoteCount, voteCount } = props;

  const handleVoteChange = (newCount: number) => {
    updateVoteCount(newCount);
  };

  return (
    <div
      className={getClasses<{
        isHoveringUpvote: boolean;
        isHoveringDownvote: boolean;
        hasUpvoted: boolean;
        hasDownvoted: boolean;
      }>(
        {
          isHoveringUpvote,
          isHoveringDownvote,
          hasUpvoted: voteCount === props.voteCount + 1,
          hasDownvoted: voteCount === props.voteCount - 1,
        },
        ComponentType.ThreadVoteButton
      )}
    >
      <CWIcon
        iconName="upvote"
        iconSize="small"
        onClick={() => {
          voteCount === voteCount + 1
            ? handleVoteChange(voteCount)
            : handleVoteChange(voteCount + 1);
        }}
        className="upvote-button"
        onMouseEnter={() => {
          setIsHoveringUpvote(true);
        }}
        onMouseLeave={() => {
          setIsHoveringUpvote(false);
        }}
      />
      <CWText
        type="caption"
        fontWeight="medium"
        className="vote-count"
        title={voteCount.toString()}
      >
        {formatNumberShort(voteCount)}
      </CWText>
      <CWIcon
        iconName="downvote"
        iconSize="small"
        onClick={() => {
          voteCount === voteCount - 1
            ? handleVoteChange(voteCount)
            : handleVoteChange(voteCount - 1);
        }}
        onMouseEnter={() => {
          setIsHoveringDownvote(true);
        }}
        onMouseLeave={() => {
          setIsHoveringDownvote(false);
        }}
        className="downvote-button"
      />
    </div>
  );
};
