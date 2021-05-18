import 'pages/bounties.scss';

import m from 'mithril';
import app from 'state';
import { Button, Grid, Col, List, Tag } from 'construct-ui';

import { formatCoin } from 'adapters/currency';
import { ProposalType } from 'identifiers';
import { formatDuration, blockperiodToDuration } from 'helpers';

import { ChainBase } from 'models';
import { CountdownUntilBlock } from 'views/components/countdown';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import ProposalCard from 'views/components/proposal_card';
import Substrate from 'controllers/chain/substrate/main';
import Listing from './listing';
import ErrorPage from './error';
import loadSubstrateModules from '../components/load_substrate_modules';

function getModules() {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = (app.chain as Substrate);
    return [ chain.bounties, chain.treasury ];
  } else {
    throw new Error('invalid chain');
  }
}

enum BountyStatus {
  Proposed,
  Approved,
  Funded,
  CuratorProposed,
  Active,
  PendingPayout,
  PayoutReady,
  Complete,
};

const bountyStatusToLabel = (bounty) => {
  if (bounty.complete) return 'Bounty claimed';
  if (bounty.isPendingPayout) return 'Pending payout';
  if (bounty.isActive) return 'Active';
  if (bounty.isCuratorProposed) return 'Waiting for curator to accept';
  if (bounty.approved) return 'Waiting for spend period';
  return 'Waiting for approval';
};

const BountyDetail = {
  view: (vnode) => {
    const { bounty } = vnode.attrs;

    const buttonAttrs = {
      fluid: true,
      rounded: true,
      intent: 'primary' as any,
    };

    return m('.BountyDetail', [
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
        bounty.status === BountyStatus.Proposed ? m(Button, {
          ...buttonAttrs,
          label: 'Create council motion',
          disabled: false, // TODO: councillors only
          onclick: (e) => {
            // TODO: create council motion to approve bounty
            // (app.chain as Substrate).bounties.approveBountyTx(author, bountyId);
          }
        }) : bounty.status === BountyStatus.Approved ? m(Button, {
          ...buttonAttrs,
          label: 'Wait for next spend period',
          disabled: true,
        }) : bounty.status === BountyStatus.Funded ? m(Button, {
          ...buttonAttrs,
          label: 'Propose curator',
          disabled: false, // TODO: councillors only
          onclick: (e) => {
            // TODO: create council motion to propose curator
            // (app.chain as Substrate).bounties.proposeCuratorTx(author, bountyId, curator, fee);
          }
        }) : bounty.status === BountyStatus.CuratorProposed ? m(Button, {
          ...buttonAttrs,
          label: true ? 'Accept curator role' : 'Waiting for curator to accept',
          disabled: true, // TODO: curator only
          onclick: (e) => {
            // TODO: create tx to accept curator role
            // (app.chain as Substrate).bounties.acceptCuratorTx(author, bountyId);
          }
        }) : bounty.status === BountyStatus.Active ? [
          m(Button, {
            ...buttonAttrs,
            label: 'Payout to recipient',
            disabled: true, // TODO: curator only
            onclick: (e) => {
              // TODO: create tx to payout
              // (app.chain as Substrate).bounties.awardBounty(author, bountyId, beneficiary);
            }
          }) ,
          m(Button, {
            ...buttonAttrs,
            label: 'Extend expiry',
            disabled: true, // TODO: curator only
            onclick: (e) => {
              // TODO: create tx to extend expiry
              // (app.chain as Substrate).bounties.extendBountyExpiry(author, bountyId, remark);
            }
          }) ,
        ] : bounty.status === BountyStatus.PendingPayout ? m(Button, {
          ...buttonAttrs,
          label: 'Payout pending', // TODO: display time left
          disabled: true,
        }) : bounty.status === BountyStatus.PendingPayout ? m(Button, {
          ...buttonAttrs,
          label: true ? 'Claim payout' : 'Payout ready to claim',
          disabled: true, // TODO: recipient only
          onclick: (e) => {
            // TODO: create tx to claim payout
            // (app.chain as Substrate).bounties.claimBounty(author, bountyId);
          }
        }) : '',
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

    const activeBounties = (app.chain as Substrate).bounties.store.getAll().filter((p) => !p.completed);
    const inactiveBounties = (app.chain as Substrate).bounties.store.getAll().filter((p) => p.completed);
    const activeBountyContent = activeBounties.length
      ? activeBounties.map((bounty) => m(ProposalCard, {
        proposal: bounty,
        injectedContent: m(BountyDetail, { bounty }),
      }))
      : [ m('.no-proposals', 'None') ];

    const inactiveBountyContent = inactiveBounties.length
      ? inactiveBounties.map((bounty) => m(ProposalCard, { proposal: bounty }))
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
          m('', [
            m(Button, {
              rounded: true,
              class: activeAccount ? '' : 'disabled',
              onclick: (e) => m.route.set(`/${app.chain.id}/new/proposal/:type`, {
                type: ProposalType.SubstrateBountyProposal,
              }),
              label: 'New bounty',
            }),
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
        content: inactiveBountyContent,
        columnHeader: 'Inactive Bounties',
      }),
      m('.clear'),
    ]);
  }
};

export default BountiesPage;
