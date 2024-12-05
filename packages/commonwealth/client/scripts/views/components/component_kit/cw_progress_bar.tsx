import React from 'react';

import { CWIcon } from './cw_icons/cw_icon';
import type { IconName } from './cw_icons/cw_icon_lookup';
import './cw_progress_bar.scss';
import { CWText } from './cw_text';

import { getClasses } from './helpers';
import { ComponentType } from './types';

type ProgressBarStatus = 'selected' | 'neutral' | 'ongoing' | 'passed';

type ProgressBarProps = {
  label: string;
  progress: number; // Percentage of progress.
  progressStatus: ProgressBarStatus;
  subtext?: string;
  iconName?: IconName;
};

export const CWProgressBar = (props: ProgressBarProps) => {
  const { label, progress, progressStatus, subtext, iconName } = props;

  return (
    <div className={ComponentType.ProgressBar}>
      <div className="progress-label">
        <div className="label-wrapper">
          <div className="label-display">
            {!!iconName && (
              <CWIcon
                iconName={iconName}
                iconSize="small"
                className="button-icon"
              />
            )}
            <CWText>{label}</CWText>
          </div>
          {subtext && (
            <CWText className="subtext-text" type="caption">
              {subtext}
            </CWText>
          )}
        </div>
        <CWText className="progress-percentage-text" type="caption">
          {`${Math.min(100, Math.floor(progress * 1000) / 1000)}%`}
        </CWText>
      </div>
      <progress
        className={getClasses<{ progressStatus: ProgressBarStatus }>({
          progressStatus,
        })}
        max="100"
        value={Math.min(100, progress)}
      />
    </div>
  );
};
