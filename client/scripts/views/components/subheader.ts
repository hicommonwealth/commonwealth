import 'components/subheader.scss';

import m from 'mithril';
import { Icon, Icons } from 'construct-ui';

const Subheader: m.Component<{ text: string }> = {
  view: (vnode) => {
    return m('.Subheader', [
      m(Icon, { name: Icons.CHEVRON_DOWN, size: 'xs' }),
      vnode.attrs.text,
    ]);
  }
};

export default Subheader;
