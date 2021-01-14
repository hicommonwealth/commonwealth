import m from 'mithril';
import { Card, Button, Input } from 'construct-ui';

import app from 'state';
import { AddressInfo } from 'models';

import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';

interface CWCollectiveStub {
  name: string;
  description: string;
  ownerAddress: string;
  ownerChain: string;
  amountBacking: number;
  amountWithdrawableBacking: number;
  amountWithdrawableInterest: number;
}

const COLLECTIVES: CWCollectiveStub[] = [{
  name: 'Commonwealth Collective',
  description: 'Lorem ipsum',
  ownerAddress: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
  ownerChain: 'commonwealth',
  amountBacking: 140.12,
  amountWithdrawableBacking: 0,
  amountWithdrawableInterest: 0.44,
}];

const CollectivesPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: 'Collectives',
        showNewProposalButton: true,
      });
    }

    return m(Sublayout, {
      class: 'CollectivesPage',
      title: 'Collectives',
      showNewProposalButton: true,
    }, [
      COLLECTIVES.map((collective) => {
        return m(Card, {
          size: 'lg',
          elevation: 0,
        }, [
          m('h4', collective.name),
          m('.collective-description', collective.description),
          m('.collective-backing', [
            `${collective.amountBacking} ETH`,
            m(User, { user: new AddressInfo(null, collective.ownerAddress, collective.ownerChain, null) }),
          ]),
          m('.collective-action', [
            m(Button, { label: 'Back Collective', rounded: true }),
            m(Input, { placeholder: 'ETH balance to stake...' }),
          ]),
          m('.collective-action', [
            m(Button, { label: 'Withdraw Amount', rounded: true }),
            m('.collective-action-text', `Current interest: ${collective.amountWithdrawableBacking} ETH`),
          ]),
          m('.collective-action', [
            m(Button, { label: 'Withdraw Interest', rounded: true }),
            m('.collective-action-text', `Current interest: ${collective.amountWithdrawableInterest} ETH`),
          ]),
        ]);
      }),
    ]);
  }
};

export default CollectivesPage;
