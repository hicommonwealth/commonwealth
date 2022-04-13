import 'components/empty_topic_placeholder.scss';

import m from 'mithril';
import app from 'state';
import { NewProposalButton } from 'views/components/new_proposal_button';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

const EmptyListingPlaceholder: m.Component<{
  stageName?: string;
  topicName?: string;
  communityName?: string;
}> = {
  view: (vnode) => {
    const { stageName, topicName, communityName } = vnode.attrs;
    if (stageName) {
      return m('.EmptyStagePlaceholder', [
        'There are no threads matching your filter.',
      ]);
    }
    return m('.EmptyListingPlaceholder', [
      m('.icon-circle', [m(CWIcon, { iconName: 'hash', iconSize: 'large' })]),
      m('h1', [
        'Welcome to the ',
        topicName
          ? [m('strong', topicName), ' topic!']
          : [m('strong', communityName), ' community!'],
      ]),
      m('p', 'There are no threads here yet.'),
      !app.isLoggedIn() && m('p', 'Log in to create a new thread.'),
      m(NewProposalButton, { fluid: false, threadOnly: true }),
    ]);
  },
};

export default EmptyListingPlaceholder;
