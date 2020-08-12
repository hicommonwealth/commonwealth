import 'components/empty_topic_placeholder.scss';

import m from 'mithril';
import { Button, Icon, Icons } from 'construct-ui';
import NewProposalButton from 'views/components/new_proposal_button';

const EmptyTopicPlaceholder: m.Component<{ topicName?: string, communityName?: string }> = {
  view: (vnode) => {
    const { topicName, communityName } = vnode.attrs;

    return m('.EmptyTopicPlaceholder', [
      m('.icon-circle', [
        m(Icon, { name: Icons.HASH, size: 'xl' }),
      ]),
      m('h1', [
        'Welcome to the ',
        topicName
          ? [ m('strong', topicName), ' topic!' ]
          : [ m('strong', communityName), ' community!' ]
      ]),
      m('p', 'There are no posts here yet.'),
      m(NewProposalButton, { fluid: false, threadOnly: true }),
    ]);
  }
};

export default EmptyTopicPlaceholder;
