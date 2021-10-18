import 'components/commonwealth/project_card.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';
import app from 'state';
import { CMNCollective } from 'models';
import BN from 'bn.js';

const CollectiveCard: m.Component<{ collective: CMNCollective }> = {
  view: (vnode) => {
    const { collective } = vnode.attrs;

    const totalFunding = new BN(collective.totalFunding.toString())
      .div(new BN(100000000))
      .toNumber();

    const displayText = collective.withdrawIsDone
      ? `Withdraw is done. Total Funding was ${totalFunding} USD`
      : `Total Funding: ${totalFunding} USD`;

    return m('.ProjectCard', [
      m(
        '.project-card-top',
        {
          onclick: (e) => {
            e.stopPropagation();
            e.preventDefault();
            m.route.set(
              `/${app.activeChainId()}/collective/${collective.address}`
            );
          },
        },
        [
          m(Tag, {
            label: ['Project #', collective.address.substring(0, 5)],
            intent: 'primary',
            rounded: true,
            size: 'xs',
            style: `background: green`,
          }),
          m('.project-title', collective.name),
          m('.project-display', displayText),
          m('.project-description', collective.description),
        ]
      ),

      m(
        '.project-card-bottom',
        {
          onclick: (e) => {
            e.preventDefault();
          },
        },
        [m('.no-linked-thread', 'No linked thread')]
      ),
    ]);
  },
};

export default CollectiveCard;
