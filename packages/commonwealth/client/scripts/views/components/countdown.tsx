/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import moment from 'moment';
import { blocknumToTime, formatDuration } from 'helpers';

type CountdownAttrs = {
  duration?: moment.Duration;
  includeSeconds?: boolean;
  time?: moment.Moment;
};

export class Countdown extends ClassComponent<CountdownAttrs> {
  private timer;
  private timerHandle;

  view(vnode: ResultNode<CountdownAttrs>) {
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
            redraw();
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
  view(vnode: ResultNode<CountdownUntilBlockAttrs>) {
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
