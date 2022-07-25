/* @jsx m */
import m from 'mithril';

import 'components/component_kit/cw_progress_bar.scss';

import { getClasses } from './helpers';
import { ComponentType } from './types';
import { CWText } from './cw_text';

type CWProgressBarStatus = 'failed' | 'neutral' | 'ongoing' | 'passed';

type CWProgressBarAttrs = {
  progress: number; // Percentage of progress.
  progressStatus: CWProgressBarStatus;
  progressHeight?: number;
  className?: string;
  label?: string;
  count?: number;
  token?: string;
};

export class CWProgressBar implements m.ClassComponent<CWProgressBarAttrs> {
  view(vnode) {
    const {
      className,
      progress,
      progressStatus,
      progressHeight = 4,
      label,
      count,
      token,
    } = vnode.attrs;
    return (
      <>
        {label && (
          <div class="progress-label">
            <CWText className="progress-title">{label}</CWText>
            {token && token.length > 0 && (
              <CWText className="progress-percentage" type="caption">
                {`${Math.floor(count * 1000) / 1000} ${token}`}
              </CWText>
            )}
            <CWText className="progress-percentage" type="caption">{`${
              Math.floor(progress * 1000) / 1000
            }%`}</CWText>
          </div>
        )}
        <div class="progress-background" style={`height: ${progressHeight}px;`}>
          <div
            class={getClasses<CWProgressBarAttrs>(
              {
                className,
                progress,
                progressStatus,
              },
              ComponentType.ProgressBar
            )}
            style={`height: ${progressHeight}px; width: ${progress}%;`}
          />
        </div>
      </>
    );
  }
}
