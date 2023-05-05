import React from 'react';

// import 'components/component_kit/cw_card.scss';
import '../../../../styles/components/component_kit/cw_card.scss';
import { getClasses } from './helpers';

import { ComponentType } from './types';

export type CardElevation = 'elevation-1' | 'elevation-2' | 'elevation-3';

type CardStyleProps = {
  className?: string;
  elevation?: CardElevation;
  fullWidth?: boolean;
  interactive?: boolean;
};

type CardProps = {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onmouseover?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
} & CardStyleProps &
  React.PropsWithChildren;

export const CWCard = (props: CardProps) => {
  const {
    className,
    elevation,
    fullWidth,
    interactive = false,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onmouseover,
  } = props;

  return (
    <div
      className={getClasses<CardStyleProps>(
        {
          elevation,
          fullWidth,
          interactive,
          className,
        },
        ComponentType.Card
      )}
      onClick={onClick}
      onMouseOver={onmouseover}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {props.children}
    </div>
  );
};
