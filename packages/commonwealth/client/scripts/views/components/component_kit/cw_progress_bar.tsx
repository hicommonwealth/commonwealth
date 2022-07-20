/* @jsx m */
import m from 'mithril';
import { getClasses } from './helpers';
import { ComponentType } from './types';
import 'components/component_kit/cw_progress_bar.scss';

export const enum CWProgressBarStatus {
  ongoing = 'ongoing',
  passed = 'passed',
  failed = 'failed',
  neutral = 'neutral',
}

type CWProgressBarAttrs = {
  className: string;
  progress: number; // Percentage of progress.
  progressStatus?: CWProgressBarStatus;
  progressHeight?: number;
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
      progressHeight,
      label,
      count,
      token,
    } = vnode.attrs;
    return (
      <>
        {label && (
          <div className="progress-label">
            <div>
              <div className="progress-title">{label}</div>
              {token.length > 0 && (
                <div className="progress-percentage">{`${
                  Math.floor(count * 1000) / 1000
                } ${token}`}</div>
              )}
            </div>
            <div className="progress-percentage">{`${
              Math.floor(progress * 1000) / 1000
            }%`}</div>
          </div>
        )}
        <div
          className="progress-background"
          style={`height: ${progressHeight}px;`}
        >
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
