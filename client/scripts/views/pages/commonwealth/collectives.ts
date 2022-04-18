import 'pages/commonwealth/collectives.scss';

import m from 'mithril';
import { Card, Button, Input } from 'construct-ui';

import app from 'state';
import { AddressInfo } from 'models';
import { pluralize } from 'helpers';

import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';

interface CWCollectiveStub {
  name: string;
  description: string;
  numMembers: number;
  ownerAddress: string;
  ownerChain: string;
  amountBacking: number;
  amountWithdrawableBacking: number;
  amountWithdrawableInterest: number;
}

const COLLECTIVES: CWCollectiveStub[] = [
  {
    name: 'Commonwealth Collective',
    description: 'Lorem ipsum',
    numMembers: 12,
    ownerAddress: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
    ownerChain: 'commonwealth',
    amountBacking: 140.12,
    amountWithdrawableBacking: 0,
    amountWithdrawableInterest: 0.44,
  },
];

const CollectivesPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: 'Collectives',
        showNewProposalButton: true,
      });
    }

    return m(
      Sublayout,
      {
        title: 'Collectives',
        showNewProposalButton: true,
      },
      m('.CollectivesPage', [
        COLLECTIVES.map((collective) => {
          return m(
            Card,
            {
              size: 'lg',
              elevation: 0,
            },
            [
              m('h4', collective.name),
              m('.collective-description', collective.description),
              m('.collective-metadata', [
                m('.collective-metadata-beneficiary', [
                  m(User, {
                    user: new AddressInfo(
                      null,
                      collective.ownerAddress,
                      collective.ownerChain,
                      null
                    ),
                  }),
                ]),
                m('.collective-metadata-members', [
                  pluralize(collective.numMembers, 'backer'),
                ]),
              ]),
              m('.collective-metrics', [
                m('.collective-metric', [
                  m('.collective-metric-figure', collective.amountBacking),
                  m('.collective-metric-title', 'Backing'),
                ]),
                m('.collective-metric', [
                  m(
                    '.collective-metric-figure',
                    collective.amountWithdrawableBacking
                  ),
                  m('.collective-metric-title', 'Your Backing'),
                ]),
              ]),
              m('.collective-action', [
                m(Input, {
                  fluid: true,
                  placeholder: 'Amount of ETH to back',
                }),
                m(Button, {
                  label: 'Back Collective',
                  rounded: true,
                  fluid: true,
                  intent: 'primary',
                }),
                m(Button, {
                  label: 'Withdraw Backing',
                  rounded: true,
                  fluid: true,
                }),
                m(Button, {
                  label: `Withdraw Interest (${collective.amountWithdrawableInterest} ETH)`,
                  rounded: true,
                  fluid: true,
                }),
              ]),
            ]
          );
        }),
      ])
    );
  },
};

export default CollectivesPage;
