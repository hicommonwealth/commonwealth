import 'components/empty_topic_placeholder.scss';

import m from 'mithril';
import { Button, Icon, Icons } from 'construct-ui';
import app from 'state';
import NewProposalButton from 'views/components/new_proposal_button';

export const EmptyStagePlaceholder: m.Component<{}> = {
  view: (vnode) => {
    return m('.EmptyStagePlaceholder', [
      'There are no threads matching your filter.'
    ]);
  }
};

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
      m('p', 'There are no threads here yet.'),
      !app.isLoggedIn() && m('p', 'Log in to create a new thread.'),
      m(NewProposalButton, { fluid: false, threadOnly: true }),
    ]);
  }
};

export default EmptyTopicPlaceholder;
