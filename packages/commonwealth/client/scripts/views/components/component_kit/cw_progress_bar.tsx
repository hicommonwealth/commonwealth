/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_progress_bar.scss';

import { getClasses } from './helpers';
import { ComponentType } from './types';
import { CWText } from './cw_text';

type ProgressBarStatus = 'failed' | 'neutral' | 'ongoing' | 'passed';

type ProgressBarAttrs = {
  label: string;
  progress: number; // Percentage of progress.
  progressStatus: ProgressBarStatus;
  subtext?: string;
};

export class CWProgressBar implements m.ClassComponent<ProgressBarAttrs> {
  view(vnode) {
    const { label, progress, progressStatus, subtext } = vnode.attrs;

    return (
      <div class={ComponentType.ProgressBar}>
        <div class="progress-label">
          <div class="label-wrapper">
            <CWText>{label}</CWText>
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
