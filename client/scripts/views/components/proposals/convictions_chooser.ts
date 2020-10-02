import 'components/proposals/convictions_chooser.scss';

import m from 'mithril';
import { Select } from 'construct-ui';

import app from 'state';
import {
  convictionToWeight, convictionToLocktime, convictions
} from 'controllers/chain/substrate/democracy_referendum';

export const ConvictionsChooser: m.Component<{ callback: Function }, {}> = {
  view: (vnode) => {
    return m(Select, {
      class: 'ConvictionsChooser',
      name: 'convictions',
      size: 'sm',
      oncreate: () => {
        vnode.attrs.callback(convictions()[0].toString());
      },
      defaultValue: convictions()[0].toString(),
      options: convictions().map((c) => ({
        value: c.toString(),
        label: `${convictionToWeight(c)}x weight (${convictionToLocktime(c)}x lock)`,
      })),
      onchange: (e) => {
        const result = (e.target as any).value;
        vnode.attrs.callback(result);
      },
    });
  }
};

export default ConvictionsChooser;
