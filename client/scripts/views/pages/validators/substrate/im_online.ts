import m from 'mithril';
import { Icons, Icon } from 'construct-ui';
import { u32 } from '@polkadot/types';

interface IValidatorAttrs {
  toBeElected: Boolean;
  hasMessage: Boolean;
  isOnline: Boolean;
  blockCount: u32;
}

const CardSummary: m.Component<IValidatorAttrs, {}> = {
  view: (vnode) => {
    return m('td.val-im-online',
      m('span.im-online-icons', [
        vnode.attrs.toBeElected
    && m(Icon, { name: Icons.ARROW_LEFT_CIRCLE, size: 'sm' }),
        vnode.attrs.isOnline
    && m(Icon, { name: Icons.WIFI, size: 'sm' }),
        vnode.attrs.hasMessage
    && m(Icon, { name: Icons.MESSAGE_SQUARE, size: 'sm' }),
        vnode.attrs.blockCount
    && m('label.block-count', vnode.attrs.blockCount)
      ]));
  },
};

export default CardSummary;
