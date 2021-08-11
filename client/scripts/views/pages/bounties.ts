import 'pages/bounties.scss';

import m from 'mithril';
import app from 'state';
import { Button, Grid, Col, List, Tag } from 'construct-ui';

import { formatCoin } from 'adapters/currency';
import { ProposalType } from 'identifiers';
import { formatDuration, blockperiodToDuration } from 'helpers';

import Substrate from 'controllers/chain/substrate/main';
import { SubstrateAccount } from 'controllers/chain/substrate/account';

import { AddressInfo, ChainBase } from 'models';
import { CountdownUntilBlock } from 'views/components/countdown';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import ProposalCard from 'views/components/proposal_card';
import User from 'views/components/widgets/user';

import {
  ApproveBountyModal, ProposeCuratorModal, AwardBountyModal, ExtendExpiryModal
} from 'views/modals/bounty_modals';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { notifyError } from 'controllers/app/notifications';

import Listing from './listing';
import ErrorPage from './error';
import loadSubstrateModules from '../components/load_substrate_modules';
import { SubstrateBounty } from 'client/scripts/controllers/chain/substrate/bounty';

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = (app.chain as Substrate);
    return [ chain.bounties, chain.treasury, chain.phragmenElections ];
  } else {
    throw new Error('invalid chain');
  }
}

const bountyStatusToLabel = (bounty) => {
  if (bounty.complete) return 'Bounty claimed';
  if (bounty.isPendingPayout) return 'Pending council review';
  if (bounty.isActive) return 'Active';
  if (bounty.isCuratorProposed) return 'Waiting for curator to accept';
  if (bounty.approved) return 'Waiting for spend period';
  return 'Waiting for approval';
};

const BountyDetail = {
  view: (vnode: m.Vnode<{ proposal: SubstrateBounty }>) => {
    const { proposal: bounty } = vnode.attrs;
    const isCouncillor = app.chain
      && ((app.chain as Substrate).phragmenElections.members || [])
        .map((a) => app.chain.accounts.get(a))
        .find((a) => a.chain === app.user.activeAccount?.chain && a.address === app.user.activeAccount?.address);
    const isCurator = app.user.activeAccount?.address === bounty.curator;
    const isRecipient = app.user.activeAccount?.address === bounty.beneficiary;

    const buttonAttrs = {
      fluid: true,
      rounded: true,
      intent: 'primary' as any,
    };

    return m('.BountyDetail', {
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
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
        bounty.isProposed ? [
          m(Button, {
            ...buttonAttrs,
            label: 'Motion to approve',
            disabled: !isCouncillor,
            onclick: (e) => {
              app.modals.create({
                modal: ApproveBountyModal,
                data: { bountyId: bounty.identifier }
              });
            }
          }),
        ] : bounty.isApproved ? [
          m(Button, {
            ...buttonAttrs,
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
                includeSeconds: false
              })
              : '--',
          ]),
        ] : bounty.isFunded ? [
          m(Button, {
            ...buttonAttrs,
            label: 'Motion to assign curator',
            disabled: !isCouncillor,
            onclick: (e) => {
              app.modals.create({
                modal: ProposeCuratorModal,
                data: { bountyId: bounty.identifier }
              });
            }
          }),
          m('p', [
            'Bounty amount: ',
            bounty.value && formatCoin(bounty.value),
          ]),
        ] : bounty.isCuratorProposed ? [
          m(Button, {
            ...buttonAttrs,
            label: isCurator ? 'Accept curator role' : 'Waiting for curator to accept',
            disabled: !isCurator,
            onclick: async (e) => {
              const confirmed = await confirmationModalWithText(
                'Accept your role as curator? This requires putting down a curator deposit.', 'Yes'
              )();
              if (!confirmed) return;
              await createTXModal(
                (app.chain as Substrate).bounties.acceptCuratorTx(
                  app.user?.activeAccount as SubstrateAccount,
                  bounty.data.index,
                )
              );
            }
          }),
          m('p', [
            'Bounty amount: ',
            bounty.value && formatCoin(bounty.value),
          ]),
          m('p', [
            'Proposed curator: ',
            m(User, {
              user: new AddressInfo(null, bounty.curator, app.chain.id, null),
              linkify: true,
            }),
          ]),
          m('p', [
            'Curator fee: ',
            bounty.fee && formatCoin(bounty.fee),
          ]),
        ] : bounty.isActive ? [
          m(Button, {
            ...buttonAttrs,
            label: 'Payout to recipient',
            disabled: !isCurator,
            onclick: (e) => {
              app.modals.create({
                modal: AwardBountyModal,
                data: { bountyId: bounty.identifier }
              });
            }
          }),
          m(Button, {
            ...buttonAttrs,
            label: 'Extend expiry',
            disabled: !isCurator,
            onclick: (e) => {
              app.modals.create({
                modal: ExtendExpiryModal,
                data: { bountyId: bounty.identifier }
              });
            }
          }),
          m('p', [
            'Bounty amount: ',
            bounty.value && formatCoin(bounty.value),
          ]),
          m('p', [
            'Curator: ',
            m(User, {
              user: new AddressInfo(null, bounty.curator, app.chain.id, null),
              linkify: true,
            }),
          ]),
          m('p', [
            'Curator fee: ',
            bounty.fee && formatCoin(bounty.fee),
          ]),
          m('p', [
            'Curator deposit: ',
            bounty.fee && formatCoin(bounty.curatorDeposit),
          ]),
          m('p', [
            bounty.updateDue ? [
              'Must renew within: ',
              m(CountdownUntilBlock, {
                block: bounty.updateDue,
                includeSeconds: false,
              }),
            ] : [
              'Renewal period just extended'
            ]
          ]),
        ] : bounty.isPendingPayout ? [
          m(Button, {
            ...buttonAttrs,
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
              includeSeconds: false
            })
          ]),
        ] : bounty.isPendingPayout ? [
          m(Button, {
            ...buttonAttrs,
            label: isRecipient ? 'Claim payout' : 'Payout ready to claim',
            disabled: !isRecipient,
            onclick: async (e) => {
              const confirmed = await confirmationModalWithText(
                'Claim your bounty payout?', 'Yes'
              )();
              if (confirmed) {
                (app.chain as Substrate).bounties.claimBountyTx(
                  app.user.activeAccount as SubstrateAccount,
                  bounty.data.index,
                );
              }
            }
          }),
          m('p', [
            'Curator: ',
            m(User, {
              user: new AddressInfo(null, bounty.curator, app.chain.id, null),
              linkify: true,
            }),
          ]),
          m('p', [
            'Recipient: ',
            m(User, {
              user: new AddressInfo(null, bounty.beneficiary, app.chain.id, null),
              linkify: true,
            }),
          ]),
          m('p', [
            'Review period ends at: ',
            m(CountdownUntilBlock, {
              block: bounty.unlockAt,
              includeSeconds: false
            })
          ]),
        ] : '',
      ]),
    ]);
  }
};

const BountiesPage: m.Component<{}> = {
  view: (vnode) => {
    const activeAccount = app.user.activeAccount;

    if (!app.chain || !app.chain.loaded) {
      if (app.chain?.base === ChainBase.Substrate && (app.chain as Substrate).chain?.timedOut) {
        return m(ErrorPage, {
          message: 'Chain connection timed out.',
          title: [
            'Bounties',
            m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
          ],
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: [
          'Bounties',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
        showNewProposalButton: true,
      });
    }

    const modLoading = loadSubstrateModules('Bounties', getModules);
    if (modLoading) return modLoading;

    const activeBounties = (app.chain as Substrate).bounties.store.getAll()
      .filter((p) => !p.completed && !p.isPendingPayout)
      .sort((a, b) => +a.identifier - +b.identifier);
    const pendingBounties = (app.chain as Substrate).bounties.store.getAll()
      .filter((p) => !p.completed && p.isPendingPayout)
      .sort((a, b) => +a.identifier - +b.identifier);
    const inactiveBounties = (app.chain as Substrate).bounties.store.getAll().filter((p) => p.completed)
      .sort((a, b) => +a.identifier - +b.identifier);
    const activeBountyContent = activeBounties.length
      ? activeBounties.map((bounty) => m(ProposalCard, {
        proposal: bounty,
        injectedContent: BountyDetail,
      }))
      : [ m('.no-proposals', 'None') ];

    const pendingBountyContent = pendingBounties.length
      ? pendingBounties.map((bounty) => m(ProposalCard, { proposal: bounty, injectedContent: BountyDetail, }))
      : [ m('.no-proposals', 'None') ];

    const inactiveBountyContent = inactiveBounties.length
      ? inactiveBounties.map((bounty) => m(ProposalCard, { proposal: bounty, injectedContent: BountyDetail, }))
      : [ m('.no-proposals', 'None') ];

    return m(Sublayout, {
      class: 'BountiesPage',
      title: [
        'Bounties',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
      // stats
      m('.stats-box', [
        m('.stats-box-left', '💭'),
        m('.stats-box-right', [
          m('', [
            m('strong', 'Bounties'),
            m('span', [
              ' are requests for treasury funding that are assigned by the council to be managed by a curator.',
            ]),
          ]),
          m('', [
            m('.stats-box-stat', [
              'Treasury: ',
              app.chain && formatCoin((app.chain as Substrate).treasury.pot),
            ]),
            m('.stats-box-stat', [
              'Next spend period: ',
              (app.chain as Substrate).treasury.nextSpendBlock
                ? m(CountdownUntilBlock, {
                  block: (app.chain as Substrate).treasury.nextSpendBlock,
                  includeSeconds: false
                })
                : '--',
            ]),
          ]),
        ]),
      ]),
      m('.clear'),
      m(Listing, {
        content: activeBountyContent,
        columnHeader: 'Active Bounties',
      }),
      m('.clear'),
      m(Listing, {
        content: pendingBountyContent,
        columnHeader: 'Payout Pending Review',
      }),
      m('.clear'),
      m(Listing, {
        content: inactiveBountyContent,
        columnHeader: 'Inactive Bounties',
      }),
      m('.clear'),
    ]);
  }
};

export default BountiesPage;
