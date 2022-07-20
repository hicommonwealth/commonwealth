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
};

export class CWProgressBar implements m.ClassComponent<CWProgressBarAttrs> {
  view(vnode) {
    const { className, progress, progressStatus, progressHeight, label } =
      vnode.attrs;
    return (
      <>
        {label && (
          <div className="progress-label">
            <div className="progress-title">{label}</div>
            <div className="progress-percentage">{`${progress}%`}</div>
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
