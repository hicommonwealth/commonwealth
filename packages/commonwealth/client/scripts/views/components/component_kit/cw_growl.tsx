import 'components/component_kit/cw_growl.scss';
import React from 'react';

import { CWCard } from './cw_card';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type GrowlPosition = 'bottom-left' | 'bottom-right';

type GrowlAttrs = {
  className?: string;
  disabled: boolean;
  onclose?: () => void;
  position: GrowlPosition;
} & React.PropsWithChildren;

export const CWGrowl = (props: GrowlAttrs) => {
  const { className, position, disabled } = props;

  return (
    !disabled && (
      <div
        className={getClasses<{
          className?: string;
          position: GrowlPosition;
        }>({ className, position }, ComponentType.Growl)}
      >
        <CWCard className="growl-card" elevation="elevation-3" interactive>
          {props.children}
        </CWCard>
      </div>
    )
  );
};
