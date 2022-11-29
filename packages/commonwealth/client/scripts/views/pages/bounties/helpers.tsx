/* @jsx m */

import m from 'mithril';

import 'pages/bounties.scss';

import app from 'state';
import { SubstrateBounty } from 'controllers/chain/substrate/bounty';
import { formatCoin } from 'adapters/currency';
import { ChainBase } from 'common-common/src/types';
import Substrate from 'controllers/chain/substrate/adapter';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { AddressInfo } from 'models';
import { CountdownUntilBlock } from 'views/components/countdown';
import User from 'views/components/widgets/user';
import {
  ApproveBountyModal,
  ProposeCuratorModal,
  AwardBountyModal,
  ExtendExpiryModal,
} from 'views/modals/bounty_modals';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';

export const getModules = () => {
  if (!app || !app.chain || !app.chain.loaded) {
    throw new Error('secondary loading cmd called before chain load');
  }
  if (app.chain.base === ChainBase.Substrate) {
    const chain = app.chain as Substrate;
    return [chain.bounties, chain.treasury, chain.phragmenElections];
  } else {
    throw new Error('invalid chain');
  }
};

export const getActionSection = (
  bounty: SubstrateBounty,
  isCouncillor: boolean,
  isCurator: boolean,
  isRecipient: boolean
) => {
  if (bounty.isProposed) {
    return (
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
    );
  } else if (bounty.isApproved) {
    return (
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
    );
  } else if (bounty.isFunded) {
    return (
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
    );
  } else if (bounty.isCuratorProposed) {
    return (
      <>
        <CWButton
          label={
            isCurator ? 'Accept curator role' : 'Waiting for curator to accept'
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
        <div class="action-info-row">
          <CWText>Proposed curator: </CWText>
          {m(User, {
            user: new AddressInfo(null, bounty.curator, app.chain.id, null),
            linkify: true,
          })}
        </div>
        {bounty.fee && <CWText>Curator fee: {formatCoin(bounty.fee)}</CWText>}
      </>
    );
  } else if (bounty.isActive) {
    return (
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
        <div class="action-info-row">
          <CWText>Curator: </CWText>
          {m(User, {
            user: new AddressInfo(null, bounty.curator, app.chain.id, null),
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
    );
  } else if (bounty.isPendingPayout) {
    return (
      <>
        <CWText>Payout pending</CWText>
        {bounty.value && (
          <CWText>Bounty amount: {formatCoin(bounty.value)}</CWText>
        )}
        <div class="action-info-row">
          <CWText>Can be claimed in: </CWText>
          <CountdownUntilBlock block={bounty.unlockAt} includeSeconds={false} />
        </div>
      </>
    );
  } else if (!bounty.isPendingPayout) {
    return (
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
        <div class="action-info-row">
          <CWText>Curator: </CWText>
          {m(User, {
            user: new AddressInfo(null, bounty.curator, app.chain.id, null),
            linkify: true,
          })}
        </div>
        <div class="action-info-row">
          <CWText>Recipient: </CWText>
          {m(User, {
            user: new AddressInfo(null, bounty.beneficiary, app.chain.id, null),
            linkify: true,
          })}
        </div>
        <div class="action-info-row">
          <CWText>Review period ends at: </CWText>
          <CountdownUntilBlock block={bounty.unlockAt} includeSeconds={false} />
        </div>
      </>
    );
  } else {
    return null;
  }
};
