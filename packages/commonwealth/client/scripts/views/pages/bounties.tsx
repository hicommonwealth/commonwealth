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
import { ProposalCard } from 'views/components/proposal_card';
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
import { CWText } from '../components/component_kit/cw_text';

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

    return (
      <div
        class="BountyDetail"
        onclick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div class="b-box">
          <div class="b-row">
            <div class="b-col">{bounty.isProposed ? '✓' : ''}</div>
            <div class="b-col">Proposed</div>
          </div>
          <div class="b-row">
            <div class="b-col">{bounty.isApproved ? '✓' : ''}</div>
            <div class="b-col">Approved by council</div>
          </div>
          <div class="b-row">
            <div class="b-col">{bounty.isFunded ? '✓' : ''}</div>
            <div class="b-col">Funded by treasury</div>
          </div>
          <div class="b-row">
            <div class="b-col">{bounty.isCuratorProposed ? '✓' : ''}</div>
            <div class="b-col">Curator proposed</div>
          </div>
          <div class="b-row">
            <div class="b-col">{bounty.isActive ? '✓' : ''}</div>
            <div class="b-col">Curator selected</div>
          </div>
          <div class="b-row">
            <div class="b-col">{bounty.isPendingPayout ? '✓' : ''}</div>
            <div class="b-col">Payout pending</div>
          </div>
        </div>
        <div class="action">
          {bounty.isProposed ? (
            <CWButton
              label="Motion to approve"
              disabled={!isCouncillor}
              onclick={() => {
                app.modals.create({
                  modal: ApproveBountyModal,
                  data: { bountyId: bounty.identifier },
                });
              }}
            />
          ) : bounty.isApproved ? (
            <>
              <CWButton label="Waiting for funding" disabled />
              {bounty.value && (
                <CWText>Bounty amount: {formatCoin(bounty.value)}</CWText>
              )}
              <CWText>
                Next spend period:{' '}
                {(app.chain as Substrate).treasury.nextSpendBlock ? (
                  <CountdownUntilBlock
                    block={(app.chain as Substrate).treasury.nextSpendBlock}
                    includeSeconds={false}
                  />
                ) : (
                  '--'
                )}
              </CWText>
            </>
          ) : bounty.isFunded ? (
            <>
              <CWButton
                label="Motion to assign curator"
                disabled={!isCouncillor}
                onclick={() => {
                  app.modals.create({
                    modal: ProposeCuratorModal,
                    data: { bountyId: bounty.identifier },
                  });
                }}
              />
              {bounty.value && (
                <CWText>Bounty amount: {formatCoin(bounty.value)}</CWText>
              )}
            </>
          ) : bounty.isCuratorProposed ? (
            <>
              <CWButton
                label={
                  isCurator
                    ? 'Accept curator role'
                    : 'Waiting for curator to accept'
                }
                disabled={!isCurator}
                onclick={async () => {
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
                }}
              />
              {bounty.value && (
                <CWText>Bounty amount: {formatCoin(bounty.value)}</CWText>
              )}
              <div>
                <CWText>Proposed curator: </CWText>
                {m(User, {
                  user: new AddressInfo(
                    null,
                    bounty.curator,
                    app.chain.id,
                    null
                  ),
                  linkify: true,
                })}
              </div>
              {bounty.fee && (
                <CWText>Curator fee: {formatCoin(bounty.fee)}</CWText>
              )}
            </>
          ) : bounty.isActive ? (
            <>
              <CWButton
                label="Payout to recipient"
                disabled={!isCurator}
                onclick={() => {
                  app.modals.create({
                    modal: AwardBountyModal,
                    data: { bountyId: bounty.identifier },
                  });
                }}
              />
              <CWButton
                label="Extend expiry"
                disabled={!isCurator}
                onclick={() => {
                  app.modals.create({
                    modal: ExtendExpiryModal,
                    data: { bountyId: bounty.identifier },
                  });
                }}
              />
              {bounty.value && (
                <CWText>Bounty amount: {formatCoin(bounty.value)}</CWText>
              )}
              <div>
                <CWText>Curator: </CWText>
                {m(User, {
                  user: new AddressInfo(
                    null,
                    bounty.curator,
                    app.chain.id,
                    null
                  ),
                  linkify: true,
                })}
              </div>
              {bounty.fee && (
                <>
                  <CWText>Curator fee: {formatCoin(bounty.fee)}</CWText>
                  <CWText>
                    Curator deposit: {formatCoin(bounty.curatorDeposit)}
                  </CWText>
                </>
              )}
              {bounty.updateDue ? (
                <>
                  <CWText>Must renew within: </CWText>
                  <CountdownUntilBlock
                    block={bounty.updateDue}
                    includeSeconds={false}
                  />
                </>
              ) : (
                <CWText>Renewal period just extended</CWText>
              )}
            </>
          ) : bounty.isPendingPayout ? (
            <>
              <CWText>Payout pending</CWText>
              {bounty.value && (
                <CWText>Bounty amount: {formatCoin(bounty.value)}</CWText>
              )}
              <div>
                <CWText>Can be claimed in: </CWText>
                <CountdownUntilBlock
                  block={bounty.unlockAt}
                  includeSeconds={false}
                />
              </div>
            </>
          ) : bounty.isPendingPayout ? (
            <>
              <CWButton
                label={isRecipient ? 'Claim payout' : 'Payout ready to claim'}
                disabled={!isRecipient}
                onclick={async () => {
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
                }}
              />
              <div>
                <CWText>Curator: </CWText>
                {m(User, {
                  user: new AddressInfo(
                    null,
                    bounty.curator,
                    app.chain.id,
                    null
                  ),
                  linkify: true,
                })}
              </div>
              <div>
                <CWText>Recipient: </CWText>
                {m(User, {
                  user: new AddressInfo(
                    null,
                    bounty.beneficiary,
                    app.chain.id,
                    null
                  ),
                  linkify: true,
                })}
              </div>
              <div>
                <CWText>Review period ends at: </CWText>
                <CountdownUntilBlock
                  block={bounty.unlockAt}
                  includeSeconds={false}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
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

    const activeBountyContent = activeBounties.length ? (
      activeBounties.map((bounty) => (
        <ProposalCard
          proposal={bounty}
          injectedContent={<BountyDetail proposal={bounty} />}
        />
      ))
    ) : (
      <div class="no-proposals">None</div>
    );

    const pendingBountyContent = pendingBounties.length ? (
      pendingBounties.map((bounty) => (
        <ProposalCard
          proposal={bounty}
          injectedContent={<BountyDetail proposal={bounty} />}
        />
      ))
    ) : (
      <div class="no-proposals">None</div>
    );

    const inactiveBountyContent = inactiveBounties.length ? (
      inactiveBounties.map((bounty) => (
        <ProposalCard
          proposal={bounty}
          injectedContent={<BountyDetail proposal={bounty} />}
        />
      ))
    ) : (
      <div class="no-proposals">None</div>
    );

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
