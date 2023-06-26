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
  propsUpvoted,
}) => {
  const [count, setCount] = useState<number>(voteCount);
  const [upvoted, setUpvoted] = useState<boolean>(!!propsUpvoted);
  const [color, setColor] = useState<string>('#656167');

  const handleUpvote = () => {
    setCount(voteCount + 1);
    setUpvoted(true);
    // change color to #338FFF // $primary-500
    setColor('#338FFF');
  };

  const handleOnMouseOver = () => setColor('#2972CC');
  const handleOnMouseLeave = () => setColor('#338FFF');

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
        weight={upvoted ? 'fill' : 'regular'}
        color={color}
      />
      <CWText
        className={upvoted ? 'upvoted' : 'noUpvote'}
        type="caption"
        fontWeight={upvoted ? 'bold' : 'regular'}
      >
        {count}
      </CWText>
    </button>
  );
};
