import m from 'mithril';
import moment from 'moment-twitter';

import { formatDuration, blocknumToTime } from 'helpers';

interface ICountdownAttrs {
  time?: moment.Moment;
  duration?: moment.Moment;
  includeSeconds?: boolean;
}

const Countdown: m.Component<ICountdownAttrs> = {
  view: (vnode: m.VnodeDOM<ICountdownAttrs>) => {
    const { time, duration, includeSeconds } = vnode.attrs;
    if (!time && !duration) return;
    const durationForDisplay = time ? moment.duration(moment(time).diff(moment())) : duration;

    return m('span.Countdown', {
      oncreate: (vvnode) => {
        vvnode.state.timerHandle = setInterval(() => {
          vvnode.state.timer++;
          m.redraw();
        }, 1000);
      },
      onremove: (vvnode) => {
        if (vvnode.state.timerHandle) {
          clearInterval(vvnode.state.timerHandle);
        }
      },
    }, includeSeconds
      ? formatDuration(durationForDisplay)
      : formatDuration(durationForDisplay, false));
  }
};

interface ICountdownUntilBlockAttrs {
  block: number;
  includeSeconds?: boolean;
}

export const CountdownUntilBlock: m.Component<ICountdownUntilBlockAttrs> = {
  view: (vnode: m.VnodeDOM<ICountdownUntilBlockAttrs>) => {
    let { includeSeconds } = vnode.attrs;
    if (!vnode.attrs.block) return;
    if (includeSeconds === undefined) includeSeconds = true;
    return m(Countdown, { time: blocknumToTime(vnode.attrs.block), includeSeconds });
  }
};

export default Countdown;
