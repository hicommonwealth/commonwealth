import m from 'mithril';

import { ITXModalData, TransactionStatus } from 'models';
import { NextFn, StageName } from './types';

const createProposalTransactionLabels = {
  // substrate: accounts
  balanceTransfer: 'Transfer balance',
  // substrate: collective
  createCouncilMotion: 'Create council motion',
  voteCouncilMotions: 'Vote on council motion',
  // substrate: elections
  submitCandidacy: 'Submit candidacy',
  setApprovals: 'Set election votes',
  retractVoter: 'Retract election votes',
  presentWinner: 'Present election winner',
  reapInactiveVoter: 'Claim inactive voter bond',
  // substrate: democracy
  createDemocracyProposal: 'Create democracy proposal',
  notePreimage: 'Note preimage',
  noteImminentPreimage: 'Note imminnet preimage',
  secondDemocracyProposal: 'Second democracy proposal',
  submitDemocracyVote: 'Vote on democracy proposal',
  submitProxyDemocracyVote: 'Vote on democracy proposal (proxy)',
  setProxy: 'Set proxy',
  resignProxy: 'Resign proxy',
  removeProxy: 'Remove proxy',
  delegate: 'Set delegate',
  undelegate: 'Remove delegate',
  // edgeware: treasury
  proposeSpend: 'Propose treasury spend',
  contractInteraction: 'Interact with contract',
  // cosmos: accounts
  MsgSend: 'Send balance',
  MsgDelegate: 'Delegate stake',
  MsgUndelegate: 'Undelegate stake',
  MsgRedelegate: 'Redelegate stake',
  // cosmos: governance
  MsgDeposit: 'Increase proposal deposit',
  MsgVote: 'Submit vote',
  MsgSubmitProposal: 'Submit proposal',
};

export const getTransactionLabel = (txname) => {
  return createProposalTransactionLabels[txname];
};

export const setupEventListeners = (
  vnode: m.Vnode<
    {
      next: NextFn;
    } & ITXModalData,
    { timerHandle?: NodeJS.Timeout } | {}
  >
) => {
  vnode.attrs.txData.events.once(TransactionStatus.Ready.toString(), () => {
    vnode.attrs.next('WaitingToConfirmTransaction', {
      events: vnode.attrs.txData.events,
    });
  });

  vnode.attrs.txData.events.once(
    TransactionStatus.Error.toString(),
    ({ err }) => {
      vnode.attrs.txData.events.removeAllListeners();
      vnode.attrs.next('SentTransactionRejected', {
        error: new Error('Transaction Failed'),
        hash: null,
        err,
      });
    }
  );

  vnode.attrs.txData.events.once(
    TransactionStatus.Failed.toString(),
    ({ hash, blocknum, err, timestamp }) => {
      // the transaction may be submitted twice, so only go to a
      // failure state if transaction has not already succeeded
      if ((vnode.state as { timerHandle?: NodeJS.Timeout }).timerHandle) {
        clearInterval(
          (vnode.state as { timerHandle?: NodeJS.Timeout }).timerHandle
        );
      }

      vnode.attrs.txData.events.removeAllListeners();

      vnode.attrs.next('SentTransactionRejected', {
        error: err,
        hash,
        blocknum,
        timestamp,
      });
    }
  );

  vnode.attrs.txData.events.once(
    TransactionStatus.Success.toString(),
    ({ hash, blocknum, timestamp }) => {
      vnode.attrs.txData.events.removeAllListeners();
      const $modal = $('.TXSigningModal');
      $modal.trigger('modalcomplete');
      vnode.attrs.next('SentTransactionSuccess', { hash, blocknum, timestamp });
    }
  );
};

export const getModalTitle = (stageName: StageName, txLabel?: string) => {
  if (stageName === 'intro') {
    return `Sign transaction ${txLabel ? `: ${txLabel}` : ''}`;
  } else if (stageName === 'waiting') {
    return 'Confirm transaction';
  } else if (stageName === 'success') {
    return 'Transaction confirmed';
  } else {
    return 'Transaction rejected';
  }
};
