/* @jsx m */

import m from 'mithril';
import { Select } from 'construct-ui';

import 'components/proposals/convictions_chooser.scss';

import {
  convictionToWeight,
  convictionToLocktime,
  convictions,
} from 'controllers/chain/substrate/democracy_referendum';

export class ConvictionsChooser
  implements m.ClassComponent<{ callback: (number) => void }>
{
  view(vnode) {
    return (
      <Select
        class="ConvictionsChooser"
        name="convictions"
        oncreate={() => {
          vnode.attrs.callback(convictions()[0].toString());
        }}
        defaultValue={convictions()[0].toString()}
        options={convictions().map((c) => ({
          value: c.toString(),
          label: `${convictionToWeight(
            c
          )}x weight (locked for ${convictionToLocktime(c)}x enactment period)`,
        }))}
        onSelect={(option) => {
          vnode.attrs.callback(parseInt((option as any).value, 10));
        }}
      />
    );
  }
}
