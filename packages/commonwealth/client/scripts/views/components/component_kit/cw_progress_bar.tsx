/* @jsx m */
import m from 'mithril';

import 'components/component_kit/cw_progress_bar.scss';

import { getClasses } from './helpers';
import { ComponentType } from './types';
import { CWText } from './cw_text';

type ProgressBarStatus = 'failed' | 'neutral' | 'ongoing' | 'passed';

type ProgressBarAttrs = {
  count?: number;
  label?: string;
  progress: number; // Percentage of progress.
  progressStatus: ProgressBarStatus;
  token?: string;
};

export class CWProgressBar implements m.ClassComponent<ProgressBarAttrs> {
  view(vnode) {
    const { count, label, progress, progressStatus, token } = vnode.attrs;
    return (
      <>
        {label && (
          <div class="progress-label">
            <CWText>{label}</CWText>
            {token && token.length > 0 && (
              <CWText className="progress-percentage-text" type="caption">
                {`${Math.min(100, Math.floor(count * 1000) / 1000)} ${token}`}
              </CWText>
            )}
            <CWText className="progress-percentage-text" type="caption">
              {`${Math.min(100, Math.floor(progress * 1000) / 1000)}%`}
            </CWText>
          </div>
        )}
        <div class="progress-background">
          <div
            class={getClasses<ProgressBarAttrs>(
              {
                progress,
                progressStatus,
              },
              ComponentType.ProgressBar
            )}
            style={`height: 4px; width: ${Math.min(100, progress)}%;`}
          />
        </div>
      </>
    );
  }
}
