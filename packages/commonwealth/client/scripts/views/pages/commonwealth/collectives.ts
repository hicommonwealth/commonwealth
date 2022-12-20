import 'pages/commonwealth/collectives.scss';

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';
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

const CollectivesPage: Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      return render(PageLoading, {
        message: 'Connecting to chain',
      });
    }

    return render(
      Sublayout,
      render('.CollectivesPage', [
        COLLECTIVES.map((collective) => {
          return render(
            Card,
            {
              size: 'lg',
              elevation: 0,
            },
            [
              render('h4', collective.name),
              render('.collective-description', collective.description),
              render('.collective-metadata', [
                render('.collective-metadata-beneficiary', [
                  render(User, {
                    user: new AddressInfo(
                      null,
                      collective.ownerAddress,
                      collective.ownerChain,
                      null
                    ),
                  }),
                ]),
                render('.collective-metadata-members', [
                  pluralize(collective.numMembers, 'backer'),
                ]),
              ]),
              render('.collective-metrics', [
                render('.collective-metric', [
                  render('.collective-metric-figure', collective.amountBacking),
                  render('.collective-metric-title', 'Backing'),
                ]),
                render('.collective-metric', [
                  render(
                    '.collective-metric-figure',
                    collective.amountWithdrawableBacking
                  ),
                  render('.collective-metric-title', 'Your Backing'),
                ]),
              ]),
              render('.collective-action', [
                render(Input, {
                  fluid: true,
                  placeholder: 'Amount of ETH to back',
                }),
                render(Button, {
                  label: 'Back Collective',
                  rounded: true,
                  fluid: true,
                  intent: 'primary',
                }),
                render(Button, {
                  label: 'Withdraw Backing',
                  rounded: true,
                  fluid: true,
                }),
                render(Button, {
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
