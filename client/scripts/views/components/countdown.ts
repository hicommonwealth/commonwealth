import m from 'mithril';
import moment from 'moment-twitter';

import { formatDuration, blocknumToTime } from 'helpers';

interface ICountdownAttrs {
  time?: moment.Moment;
  duration?: moment.Moment;
}

const Countdown: m.Component<ICountdownAttrs> = {
  view: (vnode: m.VnodeDOM<ICountdownAttrs>) => {
    const time = vnode.attrs.time;
    const duration = vnode.attrs.duration;
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
    }, formatDuration(durationForDisplay));
  }
};

interface ICountdownUntilBlockAttrs {
  block: number;
}

export const CountdownUntilBlock: m.Component<ICountdownUntilBlockAttrs> = {
  view: (vnode: m.VnodeDOM<ICountdownUntilBlockAttrs>) => {
    const block = vnode.attrs.block;
    if (!block) return;
    return m(Countdown, { time: blocknumToTime(block) });
  }
};

export default Countdown;
