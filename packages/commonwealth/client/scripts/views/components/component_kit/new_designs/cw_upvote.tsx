import React, { FC, useState } from 'react';
import { ArrowFatUp } from '@phosphor-icons/react';

import { CWText } from '../cw_text';
import { getClasses } from '../helpers';

import 'components/component_kit/new_designs/cw_upvote.scss';
import { ComponentType } from '../types';

type CWUpvoteProps = {
  voteCount: number;
  active?: boolean;
  disabled?: boolean;
  propsUpvoted?: boolean;
};

export const CWUpvote: FC<CWUpvoteProps> = ({
  voteCount,
  active,
  disabled,
}) => {
  const [count, setCount] = useState<number>(voteCount);
  const [upvoted, setUpvoted] = useState<boolean>(false);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const handleUpvote = () => {
    if (!disabled && !active) {
      setCount(voteCount + 1);
      setUpvoted(true);
    }
  };

  const handleOnMouseOver = () => {
    if (!disabled && !active) {
      setIsHovering(true);
    }
  };

  const handleOnMouseLeave = () => setIsHovering(false);

  const getIconColor = () => {
    return disabled
      ? '#A09DA1'
      : isHovering || active
      ? '#2972CC'
      : upvoted
      ? '#338FFF'
      : '#656167';
  };

  const getTextClass = () => {
    return disabled
      ? 'fontDisabled'
      : isHovering || active
      ? 'fontHovering'
      : upvoted
      ? 'fontUpvoted'
      : 'fontDefault';
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
      onMouseOver={handleOnMouseOver}
      onMouseLeave={handleOnMouseLeave}
    >
      <ArrowFatUp
        className={upvoted ? 'upvoted' : 'noUpvote'}
        size={24}
        weight={upvoted || isHovering || active ? 'fill' : 'regular'}
        color={getIconColor()}
      />
      <CWText
        className={getTextClass()}
        type="caption"
        fontWeight={upvoted ? 'bold' : 'regular'}
      >
        {count}
      </CWText>
    </button>
  );
};
