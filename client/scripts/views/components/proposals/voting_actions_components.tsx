/* @jsx m */

import m from 'mithril';

import 'components/proposals/voting_actions_components.scss';

import MolochProposal from 'controllers/chain/ethereum/moloch/proposal';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';

import { CWButton } from '../component_kit/cw_button';
import { cancelProposal } from './helpers';

export class CannotVote implements m.ClassComponent<{ label: string }> {
  view(vnode) {
    return (
      <div class="CannotVote">
        <CWButton disabled label={vnode.attrs.label} />
      </div>
    );
  }
}

// aave: queue / execute
export class QueueButton
  implements m.ClassComponent<{ proposal; votingModalOpen?: boolean }>
{
  view(vnode) {
    const { proposal, votingModalOpen } = vnode.attrs;

    return (
      (proposal instanceof AaveProposal ||
        proposal instanceof CompoundProposal) &&
      proposal.isQueueable && (
        <div class="QueueButton">
          <CWButton
            disabled={!proposal.isQueueable || votingModalOpen}
            onclick={() => proposal.queueTx().then(() => m.redraw())}
            label={
              proposal.data.queued || proposal.data.executed
                ? 'Queued'
                : 'Queue'
            }
          />
        </div>
      )
    );
  }
}

export class ExecuteButton
  implements m.ClassComponent<{ proposal; votingModalOpen?: boolean }>
{
  view(vnode) {
    const { proposal, votingModalOpen } = vnode.attrs;

    return (
      (proposal instanceof AaveProposal ||
        proposal instanceof CompoundProposal) &&
      proposal.isExecutable && (
        <div class="ExecuteButton">
          <CWButton
            disabled={!proposal.isExecutable || votingModalOpen}
            onclick={() => proposal.executeTx().then(() => m.redraw())}
            label={proposal.data.executed ? 'Executed' : 'Execute'}
          />
        </div>
      )
    );
  }
}

// moloch: cancel
export class CancelButton
  implements
    m.ClassComponent<{ proposal; votingModalOpen?; user?; onModalClose? }>
{
  view(vnode) {
    const { proposal, votingModalOpen, user, onModalClose } = vnode.attrs;

    return proposal instanceof MolochProposal ? (
      <div class="VetoButton">
        <CWButton
          buttonType="primary-red"
          disabled={
            !(proposal.canAbort(user) && !proposal.completed) || votingModalOpen
          }
          onclick={(e) =>
            cancelProposal(e, votingModalOpen, proposal, onModalClose)
          }
          label={proposal.isAborted ? 'Cancelled' : 'Cancel'}
        />
      </div>
    ) : proposal instanceof CompoundProposal ? (
      <div class="VetoButton">
        <CWButton
          buttonType="primary-red"
          disabled={proposal.completed || votingModalOpen}
          onclick={(e) =>
            cancelProposal(e, votingModalOpen, proposal, onModalClose)
          }
          label={proposal.isCancelled ? 'Cancelled' : 'Cancel'}
        />
      </div>
    ) : proposal instanceof AaveProposal && proposal.isCancellable ? (
      <div class="CancelButton">
        <CWButton
          buttonType="secondary-red"
          disabled={!proposal.isCancellable || votingModalOpen}
          onclick={(e) =>
            cancelProposal(e, votingModalOpen, proposal, onModalClose)
          }
          label={proposal.data.cancelled ? 'Cancelled' : 'Cancel'}
        />
      </div>
    ) : null;
  }
}
