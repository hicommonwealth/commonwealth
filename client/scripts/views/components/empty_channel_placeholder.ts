import 'components/empty_channel_placeholder.scss';

import m from 'mithril';
import { Button, Icon, Icons } from 'construct-ui';
import NewProposalButton from 'views/components/new_proposal_button';

const EmptyChannelPlaceholder: m.Component<{ tagName?: string, communityName?: string }> = {
  view: (vnode) => {
    const { tagName, communityName } = vnode.attrs;

    return m('.EmptyChannelPlaceholder', [
      m('.icon-circle', [
        m(Icon, { name: Icons.HASH, size: 'xl' }),
      ]),
      m('h1', [
        'Welcome to the ',
        tagName
          ? [ m('strong', tagName), ' channel!' ]
          : [ m('strong', communityName), ' community!' ]
      ]),
      m('p', 'There are no posts here yet.'),
      m(NewProposalButton, { fluid: false, threadOnly: true }),
    ]);
  }
};

export default EmptyChannelPlaceholder;
