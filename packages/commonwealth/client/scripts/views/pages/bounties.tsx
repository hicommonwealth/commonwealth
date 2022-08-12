/* @jsx m */

import m from 'mithril';

import 'pages/bounties.scss';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { ChainBase } from 'common-common/src/types';
import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { AddressInfo } from 'models';
import { CountdownUntilBlock } from 'views/components/countdown';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ProposalCard } from 'views/components/proposal_card/proposal_card';
import User from 'views/components/widgets/user';
import {
  ApproveBountyModal,
  ProposeCuratorModal,
  AwardBountyModal,
  ExtendExpiryModal,
} from 'views/modals/bounty_modals';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { createTXModal } from 'views/modals/tx_signing_modal';
import ErrorPage from './error';
import { loadSubstrateModules } from '../components/load_substrate_modules';
import { CardsCollection } from '../components/cards_collection';
import { CWButton } from '../components/component_kit/cw_button';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { GovExplainer } from '../components/gov_explainer';

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;
    return [chain.bounties, chain.treasury, chain.phragmenElections];
  } else {
    throw new Error('invalid chain');
  }
}

class BountyDetail implements m.ClassComponent {
  view(vnode) {
    const { proposal: bounty } = vnode.attrs;

    const isCouncillor =
      app.chain &&
      ((app.chain as Substrate).phragmenElections.members || [])
        .map((a) => app.chain.accounts.get(a))
        .find(
          (a) =>
            a.chain === app.user.activeAccount?.chain &&
            a.address === app.user.activeAccount?.address
        );

    const isCurator = app.user.activeAccount?.address === bounty.curator;

    const isRecipient = app.user.activeAccount?.address === bounty.beneficiary;

    return m(
      '.BountyDetail',
      {
        onclick: (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
      },
      [
        m('.b-box', [
          m('.b-row', [
            m('.b-col', bounty.isProposed ? '✓' : ''),
            m('.b-col', 'Proposed'),
          ]),
          m('.b-row', [
            m('.b-col', bounty.isApproved ? '✓' : ''),
            m('.b-col', 'Approved by council'),
          ]),
          m('.b-row', [
            m('.b-col', bounty.isFunded ? '✓' : ''),
            m('.b-col', 'Funded by treasury'),
          ]),
          m('.b-row', [
            m('.b-col', bounty.isCuratorProposed ? '✓' : ''),
            m('.b-col', 'Curator proposed'),
          ]),
          m('.b-row', [
            m('.b-col', bounty.isActive ? '✓' : ''),
            m('.b-col', 'Curator selected'),
          ]),
          m('.b-row', [
            m('.b-col', bounty.isPendingPayout ? '✓' : ''),
            m('.b-col', 'Payout pending'),
          ]),
        ]),
        m('.action', [
          bounty.isProposed
            ? [
                m(CWButton, {
                  label: 'Motion to approve',
                  disabled: !isCouncillor,
                  onclick: (e) => {
                    app.modals.create({
                      modal: ApproveBountyModal,
                      data: { bountyId: bounty.identifier },
                    });
                  },
                }),
              ]
            : bounty.isApproved
            ? [
                m(CWButton, {
                  label: 'Waiting for funding',
                  disabled: true,
                }),
                m('p', [
                  'Bounty amount: ',
                  bounty.value && formatCoin(bounty.value),
                ]),
                m('p', [
                  'Next spend period: ',
                  (app.chain as Substrate).treasury.nextSpendBlock
                    ? m(CountdownUntilBlock, {
                        block: (app.chain as Substrate).treasury.nextSpendBlock,
                        includeSeconds: false,
                      })
                    : '--',
                ]),
              ]
            : bounty.isFunded
            ? [
                m(CWButton, {
                  label: 'Motion to assign curator',
                  disabled: !isCouncillor,
                  onclick: (e) => {
                    app.modals.create({
                      modal: ProposeCuratorModal,
                      data: { bountyId: bounty.identifier },
                    });
                  },
                }),
                m('p', [
                  'Bounty amount: ',
                  bounty.value && formatCoin(bounty.value),
                ]),
              ]
            : bounty.isCuratorProposed
            ? [
                m(CWButton, {
                  label: isCurator
                    ? 'Accept curator role'
                    : 'Waiting for curator to accept',
                  disabled: !isCurator,
                  onclick: async (e) => {
                    const confirmed = await confirmationModalWithText(
                      'Accept your role as curator? This requires putting down a curator deposit.',
                      'Yes'
                    )();
                    if (!confirmed) return;
                    await createTXModal(
                      (app.chain as Substrate).bounties.acceptCuratorTx(
                        app.user?.activeAccount as SubstrateAccount,
                        bounty.data.index
                      )
                    );
                  },
                }),
                m('p', [
                  'Bounty amount: ',
                  bounty.value && formatCoin(bounty.value),
                ]),
                m('p', [
                  'Proposed curator: ',
                  m(User, {
                    user: new AddressInfo(
                      null,
                      bounty.curator,
                      app.chain.id,
                      null
                    ),
                    linkify: true,
                  }),
                ]),
                m('p', ['Curator fee: ', bounty.fee && formatCoin(bounty.fee)]),
              ]
            : bounty.isActive
            ? [
                m(CWButton, {
                  label: 'Payout to recipient',
                  disabled: !isCurator,
                  onclick: (e) => {
                    app.modals.create({
                      modal: AwardBountyModal,
                      data: { bountyId: bounty.identifier },
                    });
                  },
                }),
                m(CWButton, {
                  label: 'Extend expiry',
                  disabled: !isCurator,
                  onclick: (e) => {
                    app.modals.create({
                      modal: ExtendExpiryModal,
                      data: { bountyId: bounty.identifier },
                    });
                  },
                }),
                m('p', [
                  'Bounty amount: ',
                  bounty.value && formatCoin(bounty.value),
                ]),
                m('p', [
                  'Curator: ',
                  m(User, {
                    user: new AddressInfo(
                      null,
                      bounty.curator,
                      app.chain.id,
                      null
                    ),
                    linkify: true,
                  }),
                ]),
                m('p', ['Curator fee: ', bounty.fee && formatCoin(bounty.fee)]),
                m('p', [
                  'Curator deposit: ',
                  bounty.fee && formatCoin(bounty.curatorDeposit),
                ]),
                m('p', [
                  bounty.updateDue
                    ? [
                        'Must renew within: ',
                        m(CountdownUntilBlock, {
                          block: bounty.updateDue,
                          includeSeconds: false,
                        }),
                      ]
                    : ['Renewal period just extended'],
                ]),
              ]
            : bounty.isPendingPayout
            ? [
                m(CWButton, {
                  label: 'Payout pending',
                  disabled: true,
                }),
                m('p', [
                  'Bounty amount: ',
                  bounty.value && formatCoin(bounty.value),
                ]),
                m('p', [
                  'Can be claimed in: ',
                  m(CountdownUntilBlock, {
                    block: bounty.unlockAt,
                    includeSeconds: false,
                  }),
                ]),
              ]
            : bounty.isPendingPayout
            ? [
                m(CWButton, {
                  label: isRecipient ? 'Claim payout' : 'Payout ready to claim',
                  disabled: !isRecipient,
                  onclick: async (e) => {
                    const confirmed = await confirmationModalWithText(
                      'Claim your bounty payout?',
                      'Yes'
                    )();
                    if (confirmed) {
                      (app.chain as Substrate).bounties.claimBountyTx(
                        app.user.activeAccount as SubstrateAccount,
                        bounty.data.index
                      );
                    }
                  },
                }),
                m('p', [
                  'Curator: ',
                  m(User, {
                    user: new AddressInfo(
                      null,
                      bounty.curator,
                      app.chain.id,
                      null
                    ),
                    linkify: true,
                  }),
                ]),
                m('p', [
                  'Recipient: ',
                  m(User, {
                    user: new AddressInfo(
                      null,
                      bounty.beneficiary,
                      app.chain.id,
                      null
                    ),
                    linkify: true,
                  }),
                ]),
                m('p', [
                  'Review period ends at: ',
                  m(CountdownUntilBlock, {
                    block: bounty.unlockAt,
                    includeSeconds: false,
                  }),
                ]),
              ]
            : '',
        ]),
      ]
    );
  }
}

class BountiesPage implements m.ClassComponent {
  view() {
    if (!app.chain || !app.chain.loaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return (
          <ErrorPage
            message="Could not connect to chain"
            title={<BreadcrumbsTitleTag title="Bounties" />}
          />
        );
      }

      return (
        <PageLoading
          message="Connecting to chain"
          title={<BreadcrumbsTitleTag title="Council" />}
          showNewProposalButton
        />
      );
    }

    const modLoading = loadSubstrateModules('Bounties', getModules);

    if (modLoading) return modLoading;

    const activeBounties = (app.chain as Substrate).bounties.store
      .getAll()
      .filter((p) => !p.completed && !p.isPendingPayout)
      .sort((a, b) => +a.identifier - +b.identifier);

    const pendingBounties = (app.chain as Substrate).bounties.store
      .getAll()
      .filter((p) => !p.completed && p.isPendingPayout)
      .sort((a, b) => +a.identifier - +b.identifier);

    const inactiveBounties = (app.chain as Substrate).bounties.store
      .getAll()
      .filter((p) => p.completed)
      .sort((a, b) => +a.identifier - +b.identifier);

    const activeBountyContent = activeBounties.length
      ? activeBounties.map((bounty) =>
          m(ProposalCard, {
            proposal: bounty,
            injectedContent: m(BountyDetail, { proposal: bounty }),
          })
        )
      : [m('.no-proposals', 'None')];

    const pendingBountyContent = pendingBounties.length
      ? pendingBounties.map((bounty) =>
          m(ProposalCard, {
            proposal: bounty,
            injectedContent: m(BountyDetail, { proposal: bounty }),
          })
        )
      : [m('.no-proposals', 'None')];

    const inactiveBountyContent = inactiveBounties.length
      ? inactiveBounties.map((bounty) =>
          m(ProposalCard, {
            proposal: bounty,
            injectedContent: m(BountyDetail, { proposal: bounty }),
          })
        )
      : [m('.no-proposals', 'None')];

    return (
      <Sublayout
        title={<BreadcrumbsTitleTag title="Council" />}
        showNewProposalButton
      >
        <div class="BountiesPage">
          <GovExplainer
            statHeaders={[
              {
                statName: 'Bounties',
                statDescription: `are requests for treasury funding that \
                  are assigned by the council to be managed by a curator.`,
              },
            ]}
            stats={[
              {
                statHeading: 'Treasury:',
                stat:
                  app.chain &&
                  formatCoin((app.chain as Substrate).treasury.pot),
              },
              {
                statHeading: 'Next spend period:',
                stat: (app.chain as Substrate).treasury.nextSpendBlock ? (
                  <CountdownUntilBlock
                    block={(app.chain as Substrate).treasury.nextSpendBlock}
                    includeSeconds={false}
                  />
                ) : (
                  '--'
                ),
              },
            ]}
          />
          <CardsCollection
            content={activeBountyContent}
            header="Active Bounties"
          />
          <CardsCollection
            content={pendingBountyContent}
            header="Payout Pending Review"
          />
          <CardsCollection
            content={inactiveBountyContent}
            header="Inactive Bounties"
          />
        </div>
      </Sublayout>
    );
  }
}

export default BountiesPage;
