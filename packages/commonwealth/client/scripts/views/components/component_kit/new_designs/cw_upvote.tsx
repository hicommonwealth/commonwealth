import { ArrowFatUp } from '@phosphor-icons/react';
import React, { FC } from 'react';

import { formatNumberShort } from 'adapters/currency';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';

import 'components/component_kit/new_designs/cw_upvote.scss';
import { AnchorType } from 'views/components/component_kit/new_designs/CWPopover';
import { ComponentType } from '../types';

type CWUpvoteProps = {
  voteCount: number;
  active?: boolean;
  disabled?: boolean;
  onClick?: (e) => void;
  onMouseEnter?: (e: React.MouseEvent<AnchorType>) => void;
  onMouseLeave?: (e: React.MouseEvent<AnchorType>) => void;
};

export const CWUpvote: FC<CWUpvoteProps> = ({
  voteCount,
  active,
  disabled,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const getParameters = () => {
    return {
      active,
      disabled,
    };
  };

  return (
    <button
      className={getClasses({ ...getParameters() }, ComponentType.Upvote)}
      onClick={disabled ? null : onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ArrowFatUp
        className={getClasses({ ...getParameters() })}
        size={24}
        weight={active ? 'fill' : 'regular'}
      />
      <CWText className={getClasses({ ...getParameters() })} type="caption">
        {formatNumberShort(voteCount)}
      </CWText>
    </button>
  );
};
