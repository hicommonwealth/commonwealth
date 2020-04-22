import { default as m } from 'mithril';
import { default as moment } from 'moment-twitter';

import { formatDuration } from 'helpers';
import { blocknumToTime } from 'helpers/blocks';


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
      oncreate: (vnode) => {
        vnode.state.timerHandle = setInterval(() => {
          vnode.state.timer++;
          m.redraw();
        }, 1000);
      },
      onremove: (vnode) => {
        if (vnode.state.timerHandle) {
          clearInterval(vnode.state.timerHandle);
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
