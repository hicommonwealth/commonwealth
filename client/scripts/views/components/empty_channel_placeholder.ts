import 'components/empty_channel_placeholder.scss';

import m from 'mithril';
import { Button, Icon, Icons } from 'construct-ui';

const EmptyChannelPlaceholder: m.Component<{ tagName?: string, communityName?: string }> = {
  view: (vnode) => {
    const { tagName, communityName } = vnode.attrs;

    return m('.EmptyChannelPlaceholder', [
      m('.icon-circle', [
        m(Icon, { name: Icons.HASH, size: 'xl' }),
      ]),
      m('h1', tagName
        ? `Welcome to #${tagName}!`
        : `Welcome to the ${communityName} community!`
       ),
      m('p', `There are no posts yet.`),
    ]);
  }
};

export default EmptyChannelPlaceholder;
