import React from 'react';
import './ProposalCard.scss';

import {
  blocknumToDuration,
  formatAddressShort,
  formatNumberLong,
} from 'helpers';
import moment from 'moment';
import type { AnyProposal } from '../../../models/types';
import { ProposalStatus } from '../../../models/types';

import { Countdown } from 'views/components/countdown';
import app from '../../../state/index';

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
  if (proposal.completed) {
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
              duration={blocknumToDuration(
                app.chain.block,
                proposal.endTime.blocknum,
              )}
            />,
            ` left (ends on block ${formatNumberLong(
              proposal.endTime.blocknum,
            )})`,
          ]
        : proposal.endTime.kind === 'dynamic'
          ? [
              <Countdown
                key={proposal.endTime.kind}
                duration={blocknumToDuration(
                  app.chain.block,
                  proposal.endTime.getBlocknum(),
                )}
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
