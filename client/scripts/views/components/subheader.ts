import 'components/subheader.scss';

import m from 'mithril';
import { Icon, Icons } from 'construct-ui';

const Subheader: m.Component<{ text: string, contentRight? }> = {
  view: (vnode) => {
    const { contentRight, text } = vnode.attrs;

    return m('.Subheader', [
      m(Icon, { name: Icons.CHEVRON_DOWN, size: 'xs' }),
      text,
      contentRight && m('.subheader-content-right', contentRight),
    ]);
  }
};

export default Subheader;
