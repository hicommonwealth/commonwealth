import React from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import './ThreadTokenDrawerTrigger.scss';

interface ThreadTokenDrawerTriggerProps {
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export const ThreadTokenDrawerTrigger = ({
  onClick,
  label = 'Token',
  showLabel = true,
  className,
}: ThreadTokenDrawerTriggerProps) => {
  return (
    <button
      className={`ThreadTokenDrawerTrigger ${className || ''}`}
      onClick={onClick}
      type="button"
    >
      <CWIcon iconName="users" iconSize="small" />
      {showLabel && (
        <CWText type="caption" fontWeight="regular">
          {label}
        </CWText>
      )}
    </button>
  );
};
