/* @jsx m */

import ClassComponent from 'class_component';

import { blocknumToTime, formatDuration } from 'helpers';
import m from 'mithril';
import moment from 'moment';

type CountdownAttrs = {
  duration?: moment.Duration;
  includeSeconds?: boolean;
  time?: moment.Moment;
};

export class Countdown extends ClassComponent<CountdownAttrs> {
  private timer;
  private timerHandle;

  view(vnode: m.Vnode<CountdownAttrs>) {
    const { time, duration, includeSeconds } = vnode.attrs;
    if (!time && !duration) return;

    const durationForDisplay = time
      ? moment.duration(moment(time).diff(moment()))
      : duration;

    return (
      <span
        oncreate={() => {
          this.timerHandle = setInterval(() => {
            this.timer++;
            m.redraw();
          }, 1000);
        }}
        onremove={() => {
          if (this.timerHandle) {
            clearInterval(this.timerHandle);
          }
        }}
      >
        {includeSeconds
          ? formatDuration(durationForDisplay)
          : formatDuration(durationForDisplay, false)}
      </span>
    );
  }
}

type CountdownUntilBlockAttrs = {
  block: number;
  includeSeconds?: boolean;
};

export class CountdownUntilBlock extends ClassComponent<CountdownUntilBlockAttrs> {
  view(vnode: m.Vnode<CountdownUntilBlockAttrs>) {
    let { includeSeconds } = vnode.attrs;
    if (!vnode.attrs.block) return;
    if (includeSeconds === undefined) includeSeconds = true;

    return (
      <Countdown
        time={blocknumToTime(vnode.attrs.block)}
        includeSeconds={includeSeconds}
      />
    );
  }
}
