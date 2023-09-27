import React, { FC, useState } from 'react';
import { ArrowFatUp } from '@phosphor-icons/react';

import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { formatNumberShort } from 'adapters/currency';

import 'components/component_kit/new_designs/cw_upvote.scss';
import { ComponentType } from '../types';

type CWUpvoteProps = {
  voteCount: number;
  active?: boolean;
  disabled?: boolean;
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
      setCount(upvoted ? voteCount : voteCount + 1);
      setUpvoted(!upvoted);
    }
  };

  const handleOnMouseOver = () => {
    if (!disabled && !active) {
      setIsHovering(true);
    }
  };

  const handleOnMouseLeave = () => setIsHovering(false);

  const getParameters = () => {
    return {
      default: !isHovering,
      upvoted: upvoted,
      hover: isHovering,
      active: active,
      disabled: disabled,
    };
  };

  return (
    <button
      className={getClasses({ ...getParameters() }, ComponentType.Upvote)}
      onClick={disabled ? null : handleUpvote}
      onMouseOver={handleOnMouseOver}
      onMouseLeave={handleOnMouseLeave}
    >
      <ArrowFatUp
        className={getClasses({ ...getParameters() })}
        size={24}
        weight={upvoted || isHovering || active ? 'fill' : 'regular'}
      />
      <CWText
        className={getClasses({ ...getParameters() })}
        type="caption"
        fontWeight={upvoted ? 'bold' : 'regular'}
      >
        {formatNumberShort(count)}
      </CWText>
    </button>
  );
};
