import React, { FC, useState } from 'react';
import { ArrowFatUp } from '@phosphor-icons/react';

import { CWText } from '../cw_text';
import { getClasses } from '../helpers';

import 'components/component_kit/new_designs/cw_upvote.scss';
import { ComponentType } from '../types';

type CWUpvoteProps = {
  // updateVoteCount: (newCount: number) => void;
  voteCount: number;
  active?: boolean;
  disabled?: boolean;
};

// export const CWUpvote: FC<CWUpvoteProps> = ({ updateVoteCount, voteCount }) => {
export const CWUpvote: FC<CWUpvoteProps> = ({
  voteCount,
  active,
  disabled,
}) => {
  const [count, setCount] = useState<number>(voteCount);
  const [upvoted, setUpvoted] = useState<boolean>(false);

  const handleUpvote = () => {
    setCount(voteCount + 1);
    setUpvoted(true);
  };

  return (
    <button
      className={getClasses(
        {
          active,
          disabled,
        },
        ComponentType.Upvote
      )}
      onClick={disabled ? null : handleUpvote}
    >
      <ArrowFatUp
        className=""
        size={24}
        weight={upvoted ? 'fill' : 'regular'}
        color="#2972CC"
      />
      <CWText
        className="disabled"
        type="caption"
        fontWeight={upvoted ? 'bold' : 'regular'}
      >
        {count}
      </CWText>
    </button>
  );
};
