import React from 'react';

import { ProposalState as AaveProposalState } from '../../../../../shared/chain/types/aave';
import { ProposalState as CompoundProposalState } from '../../../../../shared/chain/types/compound';

import 'components/ProposalCard/ProposalCard.scss';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';

import {
  blocknumToDuration,
  formatAddressShort,
  formatNumberLong,
} from 'helpers';
import moment from 'moment';
import type { AnyProposal } from '../../../models/types';
import { ProposalStatus } from '../../../models/types';

import { Countdown } from 'views/components/countdown';

export const getStatusClass = (proposal: AnyProposal, isLoading?: boolean) => {
  if (isLoading) return '';
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

export const getStatusText = (proposal: AnyProposal, isLoading?: boolean) => {
  if (isLoading) return 'loading...';
  if (proposal.completed && proposal instanceof AaveProposal) {
    if (proposal.state === AaveProposalState.CANCELED) return 'Cancelled';
    if (proposal.state === AaveProposalState.EXECUTED) return 'Executed';
    if (proposal.state === AaveProposalState.EXPIRED) return 'Expired';
    if (proposal.state === AaveProposalState.FAILED) return 'Did not pass';
  } else if (proposal.completed && proposal instanceof CompoundProposal) {
    if (proposal.state === CompoundProposalState.Canceled) return 'Cancelled';
    if (proposal.state === CompoundProposalState.Executed) return 'Executed';
    if (proposal.state === CompoundProposalState.Expired) return 'Expired';
    if (proposal.state === CompoundProposalState.Defeated)
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
            key={proposal.endTime.kind}
            duration={moment
              .duration(proposal.endTime.time.diff(moment()))
              .asMilliseconds()}
          />,
          ' left',
        ]
      : proposal.endTime.kind === 'fixed_block'
      ? [
          <Countdown
            key={proposal.endTime.kind}
            duration={blocknumToDuration(proposal.endTime.blocknum)}
          />,
          ` left (ends on block ${formatNumberLong(
            proposal.endTime.blocknum,
          )})`,
        ]
      : proposal.endTime.kind === 'dynamic'
      ? [
          <Countdown
            key={proposal.endTime.kind}
            duration={blocknumToDuration(proposal.endTime.getBlocknum())}
          />,
          ` left (ends on block ${formatNumberLong(
            proposal.endTime.getBlocknum(),
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
    if (proposal.state === AaveProposalState.ACTIVE)
      return [
        proposal.isPassing === ProposalStatus.Passing
          ? 'Passing, '
          : 'Not passing, ',
        countdown,
      ];
    if (proposal.state === AaveProposalState.PENDING)
      return ['Pending, ', countdown];
    if (proposal.state === AaveProposalState.QUEUED)
      return ['Queued, ', countdown];
    if (proposal.state === AaveProposalState.SUCCEEDED) return 'Ready to queue';
    if (proposal.state === AaveProposalState.EXPIRED) return 'Expired';
  }

  if (proposal instanceof CompoundProposal) {
    if (proposal.state === CompoundProposalState.Active)
      return [
        proposal.isPassing === ProposalStatus.Passing
          ? 'Passing, '
          : 'Not passing, ',
        countdown,
      ];
    if (proposal.state === CompoundProposalState.Pending)
      return ['Pending, ', countdown];
    if (proposal.state === CompoundProposalState.Queued)
      return ['Queued, ', countdown];
    if (proposal.state === CompoundProposalState.Succeeded)
      return 'Ready to queue';
    if (proposal.state === CompoundProposalState.Expired) return 'Expired';
  }

  if (proposal.isPassing === ProposalStatus.Passed)
    return [
      'Passed, enacting in ',
      countdown.length === 2 ? countdown[0] : '???',
    ];
  if (proposal.isPassing === ProposalStatus.Failed) return 'Did not pass';
  if (proposal.isPassing === ProposalStatus.Passing)
    return ['Passing, ', countdown];
  if (proposal.isPassing === ProposalStatus.Failing) {
    return ['Not passing, ', countdown];
  }
  return '';
};

export const getPrimaryTagText = (proposal: AnyProposal) => `
  Prop ${formatAddressShort(proposal.shortIdentifier, 3, 3)}`;
