import { ArrowFatUp } from '@phosphor-icons/react';
import React, { FC } from 'react';

import { formatBigNumberShort } from 'adapters/currency';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';

import 'components/component_kit/new_designs/cw_upvote.scss';
import { BigNumber } from 'ethers';
import { AnchorType } from 'views/components/component_kit/new_designs/CWPopover';
import { ComponentType } from '../types';

type CWUpvoteProps = {
  voteCount: string;
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
      // @ts-expect-error <StrictNullChecks/>
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
        {formatBigNumberShort(BigNumber.from(voteCount || 0))}
      </CWText>
    </button>
  );
};
