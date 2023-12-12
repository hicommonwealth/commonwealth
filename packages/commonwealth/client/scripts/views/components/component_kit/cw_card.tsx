import React from 'react';

import 'components/component_kit/cw_card.scss';
import { getClasses } from './helpers';

import { ComponentType } from './types';

export type CardElevation =
  | 'elevation-1'
  | 'elevation-2'
  | 'elevation-3'
  | 'elevation-4'
  | 'elevation-5';

type CardStyleProps = {
  className?: string;
  elevation?: CardElevation;
  fullWidth?: boolean;
  interactive?: boolean;
};

type CardProps = {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseOver?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
} & CardStyleProps &
  React.PropsWithChildren;

export const CWCard = ({
  className,
  elevation,
  fullWidth,
  interactive = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseOver,
  children,
}: CardProps) => {
  return (
    <div
      className={getClasses<CardStyleProps>(
        {
          elevation,
          fullWidth,
          interactive,
          className,
        },
        ComponentType.Card,
      )}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};
