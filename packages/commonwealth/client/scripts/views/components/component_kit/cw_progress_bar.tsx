/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_progress_bar.scss';

import { getClasses } from './helpers';
import { ComponentType } from './types';
import { CWText } from './cw_text';
import { IconName } from './cw_icons/cw_icon_lookup';
import { CWIcon } from './cw_icons/cw_icon';

type ProgressBarStatus = 'selected' | 'neutral' | 'ongoing' | 'passed';

type ProgressBarAttrs = {
  label: string;
  progress: number; // Percentage of progress.
  progressStatus: ProgressBarStatus;
  subtext?: string;
  iconName?: IconName;
};

export class CWProgressBar extends ClassComponent<ProgressBarAttrs> {
  view(vnode: m.Vnode<ProgressBarAttrs>) {
    const { label, progress, progressStatus, subtext, iconName } = vnode.attrs;

    return (
      <div class={ComponentType.ProgressBar}>
        <div class="progress-label">
          <div class="label-wrapper">
            <div class="label-display">
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
          class={getClasses<{ progressStatus: ProgressBarStatus }>({
            progressStatus,
          })}
          max="100"
          value={Math.min(100, progress)}
        />
      </div>
    );
  }
}
