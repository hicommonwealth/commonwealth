import 'components/proposals/convictions_chooser.scss';

import m from 'mithril';
import { CustomSelect } from 'construct-ui';

import app from 'state';
import {
  convictionToWeight, convictionToLocktime, convictions
} from 'controllers/chain/substrate/democracy_referendum';

export const ConvictionsChooser: m.Component<{ callback: Function }, {}> = {
  view: (vnode) => {
    return m(CustomSelect, {
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
      onSelect: (result) => {
        vnode.attrs.callback(result);
      },
    });
  }
};

export default ConvictionsChooser;
