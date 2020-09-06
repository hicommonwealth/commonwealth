import m from 'mithril';
import { Icons, Icon, Tooltip } from 'construct-ui';
import { u32 } from '@polkadot/types';

interface ImOnlineAttrs {
  toBeElected: Boolean;
  hasMessage: Boolean;
  isOnline: Boolean;
  blockCount?: u32;
}

const ImOnline: m.Component<ImOnlineAttrs, {}> = {
  view: (vnode) => {
    return m(
      "td.val-im-online",
      m("span.im-online-icons", [
        vnode.attrs.toBeElected &&
        m(Tooltip, {
          trigger: m(Icon, { name: Icons.ARROW_LEFT_CIRCLE, size: "sm" }),
          content: m("div", "Validator is to be Elected"),
        }),
        vnode.attrs.isOnline &&
          m(Tooltip, {
            trigger: m(Icon, { name: Icons.WIFI, size: "sm" }),
            content: m("div", "Validator is Online!"),
          }),
        vnode.attrs.hasMessage &&
          m(Tooltip, {
            trigger: m(Icon, { name: Icons.MESSAGE_SQUARE, size: "sm" }),
            content: m("div", "New Message!"),
          }),
        vnode.attrs.blockCount &&
          m("label.block-count", vnode.attrs.blockCount),
      ])
    );
  },
};

export default ImOnline;
