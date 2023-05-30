import React from 'react';

import { AaveTypes, CompoundTypes } from 'chain-events/src/types';

import 'components/ProposalCard/ProposalCard.scss';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';

import { blocknumToDuration, formatNumberLong } from 'helpers';
import {
  chainEntityTypeToProposalShortName,
  proposalSlugToChainEntityType,
} from 'identifiers';
import type { AnyProposal } from '../../../models/types';
import { ProposalStatus } from '../../../models/types';
import moment from 'moment';

import { Countdown } from 'views/components/countdown';

export const getStatusClass = (proposal: AnyProposal) => {
  if (!proposal.initialized) return '';
  return proposal.isPassing === ProposalStatus.Passing
    ? 'pass'
    : proposal.isPassing === ProposalStatus.Passed
    ? 'pass'
    : proposal.isPassing === ProposalStatus.Failing
    ? 'fail'
    : proposal.isPassing === ProposalStatus.Failed
    ? 'fail'
    : '';
};

export const getStatusText = (proposal: AnyProposal) => {
  if (!proposal.initialized) return 'loading...';
  if (proposal.completed && proposal instanceof SubstrateDemocracyProposal) {
    if (proposal.isPassing === ProposalStatus.Passed)
      return 'Passed, moved to referendum';
    return 'Cancelled';
  } else if (proposal.completed && proposal instanceof AaveProposal) {
    if (proposal.state === AaveTypes.ProposalState.CANCELED) return 'Cancelled';
    if (proposal.state === AaveTypes.ProposalState.EXECUTED) return 'Executed';
    if (proposal.state === AaveTypes.ProposalState.EXPIRED) return 'Expired';
    if (proposal.state === AaveTypes.ProposalState.FAILED)
      return 'Did not pass';
  } else if (proposal.completed && proposal instanceof CompoundProposal) {
    if (proposal.state === CompoundTypes.ProposalState.Canceled)
      return 'Cancelled';
    if (proposal.state === CompoundTypes.ProposalState.Executed)
      return 'Executed';
    if (proposal.state === CompoundTypes.ProposalState.Expired)
      return 'Expired';
    if (proposal.state === CompoundTypes.ProposalState.Defeated)
      return 'Did not pass';
  } else if (proposal.completed) {
    if (proposal.isPassing === ProposalStatus.Passed) return 'Passed';
    if (proposal.isPassing === ProposalStatus.Failed) return 'Did not pass';
    return 'Completed';
  }

  const countdown =
    proposal.endTime.kind === 'fixed'
      ? [
          <Countdown
            duration={moment
              .duration(proposal.endTime.time.diff(moment()))
              .asMilliseconds()}
          />,
          ' left',
        ]
      : proposal.endTime.kind === 'fixed_block'
      ? [
          <Countdown
            duration={blocknumToDuration(proposal.endTime.blocknum)}
          />,
          ` left (ends on block ${formatNumberLong(
            proposal.endTime.blocknum
          )})`,
        ]
      : proposal.endTime.kind === 'dynamic'
      ? [
          <Countdown
            duration={blocknumToDuration(proposal.endTime.getBlocknum())}
          />,
          ` left (ends on block ${formatNumberLong(
            proposal.endTime.getBlocknum()
          )})`,
        ]
      : proposal.endTime.kind === 'threshold'
      ? `needs ${proposal.endTime.threshold} votes`
      : proposal.endTime.kind === 'not_started'
      ? 'not yet started'
      : proposal.endTime.kind === 'queued'
      ? 'in queue'
      : proposal.endTime.kind === 'unavailable'
      ? ''
      : '';

  if (proposal instanceof AaveProposal) {
    if (proposal.state === AaveTypes.ProposalState.ACTIVE)
      return [
        proposal.isPassing === ProposalStatus.Passing
          ? 'Passing, '
          : 'Not passing, ',
        countdown,
      ];
    if (proposal.state === AaveTypes.ProposalState.PENDING)
      return ['Pending, ', countdown];
    if (proposal.state === AaveTypes.ProposalState.QUEUED)
      return ['Queued, ', countdown];
    if (proposal.state === AaveTypes.ProposalState.SUCCEEDED)
      return 'Ready to queue';
    if (proposal.state === AaveTypes.ProposalState.EXPIRED) return 'Expired';
  }

  if (proposal instanceof CompoundProposal) {
    if (proposal.state === CompoundTypes.ProposalState.Active)
      return [
        proposal.isPassing === ProposalStatus.Passing
          ? 'Passing, '
          : 'Not passing, ',
        countdown,
      ];
    if (proposal.state === CompoundTypes.ProposalState.Pending)
      return ['Pending, ', countdown];
    if (proposal.state === CompoundTypes.ProposalState.Queued)
      return ['Queued, ', countdown];
    if (proposal.state === CompoundTypes.ProposalState.Succeeded)
      return 'Ready to queue';
    if (proposal.state === CompoundTypes.ProposalState.Expired)
      return 'Expired';
  }

  if (proposal.isPassing === ProposalStatus.Passed)
    return [
      'Passed, enacting in ',
      countdown.length === 2 ? countdown[0] : '???',
    ];
  if (proposal.isPassing === ProposalStatus.Failed) return 'Did not pass';
  if (
    proposal.isPassing === ProposalStatus.Passing &&
    proposal instanceof SubstrateDemocracyProposal
  )
    return ['Expected to pass and move to referendum, ', countdown];
  if (proposal.isPassing === ProposalStatus.Passing)
    return ['Passing, ', countdown];
  if (proposal.isPassing === ProposalStatus.Failing)
    return ['Not passing, ', countdown];
  return '';
};

export const getPrimaryTagText = (proposal: AnyProposal) => `
  ${chainEntityTypeToProposalShortName(
    proposalSlugToChainEntityType(proposal.slug)
  )} ${proposal.shortIdentifier}`;

export const getSecondaryTagText = (proposal: AnyProposal) => {
  if (
    proposal instanceof SubstrateDemocracyProposal &&
    proposal.getReferendum()
  ) {
    return `REF #${proposal.getReferendum().identifier}`;
  } else if (proposal instanceof SubstrateDemocracyReferendum) {
    const originatingProposalOrMotion = proposal.getProposalOrMotion(
      proposal.preimage
    );

    return originatingProposalOrMotion instanceof SubstrateDemocracyProposal
      ? `PROP #${originatingProposalOrMotion.identifier}`
      : 'MISSING PROP';
  } else if (
    proposal instanceof SubstrateTreasuryProposal &&
    !proposal.data.index
  ) {
    return 'MISSING DATA';
  } else {
    return null;
  }
};
