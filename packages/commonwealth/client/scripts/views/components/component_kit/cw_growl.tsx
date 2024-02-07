import React from 'react';

import 'components/component_kit/cw_growl.scss';

import { CWCard } from './cw_card';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type GrowlPosition = 'bottom-left' | 'bottom-right';

type GrowlAttrs = {
  className?: string;
  disabled: boolean;
  onClose?: () => void;
  position: GrowlPosition;
} & React.PropsWithChildren;

export const CWGrowl = ({
  className,
  position,
  disabled,
  onClose,
  children,
}: GrowlAttrs) => {
  return (
    !disabled && (
      <div
        className={getClasses<{
          className?: string;
          position: GrowlPosition;
        }>({ className, position }, ComponentType.Growl)}
      >
        <CWCard
          className="growl-card"
          elevation="elevation-3"
          interactive
          onClick={onClose}
        >
          {children}
        </CWCard>
      </div>
    )
  );
};
