/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/proposal_components.scss';

import MolochProposal from 'controllers/chain/ethereum/moloch/proposal';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { CWText } from '../../components/component_kit/cw_text';
import {
  getStatusClass,
  getStatusText,
} from '../../components/proposal_card/helpers';
import {
  ThreadLink,
  BlockExplorerLink,
  VotingInterfaceLink,
} from './proposal_header_links';
import { CWButton } from '../../components/component_kit/cw_button';
import { cancelProposal } from '../../components/proposals/helpers';

type BaseCancelButtonAttrs = {
  onModalClose?: () => void;
  votingModalOpen?: boolean;
};

type MolochCancelButtonAttrs = {
  proposal: MolochProposal;
  molochMember: MolochMember;
} & BaseCancelButtonAttrs;

export class MolochCancelButton
  implements m.ClassComponent<MolochCancelButtonAttrs>
{
  view(vnode: m.Vnode<MolochCancelButtonAttrs>) {
    const { proposal, votingModalOpen, molochMember, onModalClose } =
      vnode.attrs;

    return (
      <CWButton
        buttonType="primary-red"
        disabled={
          !(proposal.canAbort(molochMember) && !proposal.completed) ||
          votingModalOpen
        }
        onclick={(e) =>
          cancelProposal(e, votingModalOpen, proposal, onModalClose)
        }
        label={proposal.isAborted ? 'Cancelled' : 'Cancel'}
      />
    );
  }
}

type AaveCancelButtonAttrs = {
  proposal: AaveProposal;
} & BaseCancelButtonAttrs;

export class AaveCancelButton
  implements m.ClassComponent<AaveCancelButtonAttrs>
{
  view(vnode: m.Vnode<AaveCancelButtonAttrs>) {
    const { proposal, votingModalOpen, onModalClose } = vnode.attrs;

    return (
      <CWButton
        buttonType="secondary-red"
        disabled={!proposal.isCancellable || votingModalOpen}
        onclick={(e) =>
          cancelProposal(e, votingModalOpen, proposal, onModalClose)
        }
        label={proposal.data.cancelled ? 'Cancelled' : 'Cancel'}
      />
    );
  }
}

type CompoundCancelButtonAttrs = {
  proposal: CompoundProposal;
} & BaseCancelButtonAttrs;

export class CompoundCancelButton
  implements m.ClassComponent<CompoundCancelButtonAttrs>
{
  view(vnode: m.Vnode<CompoundCancelButtonAttrs>) {
    const { proposal, votingModalOpen, onModalClose } = vnode.attrs;

    return (
      <CWButton
        buttonType="primary-red"
        disabled={proposal.completed || votingModalOpen}
        onclick={(e) =>
          cancelProposal(e, votingModalOpen, proposal, onModalClose)
        }
        label={proposal.isCancelled ? 'Cancelled' : 'Cancel'}
      />
    );
  }
}

type ProposalSubheaderAttrs = {
  proposal: AaveProposal | CompoundProposal | MolochProposal;
  molochMember?: MolochMember;
} & BaseCancelButtonAttrs;

export class ProposalSubheader
  implements m.ClassComponent<ProposalSubheaderAttrs>
{
  view(vnode: m.Vnode<ProposalSubheaderAttrs>) {
    const { onModalClose, proposal, molochMember, votingModalOpen } =
      vnode.attrs;

    return (
      <div class="ProposalSubheader">
        <CWText className={`onchain-status-text ${getStatusClass(proposal)}`}>
          {getStatusText(proposal)}
        </CWText>
        {(proposal['blockExplorerLink'] ||
          proposal['votingInterfaceLink'] ||
          proposal.threadId) && (
          <div class="proposal-links">
            {proposal.threadId && <ThreadLink proposal={proposal} />}
            {proposal['blockExplorerLink'] && (
              <BlockExplorerLink proposal={proposal} />
            )}
            {proposal['votingInterfaceLink'] && (
              <VotingInterfaceLink proposal={proposal} />
            )}
          </div>
        )}
        {proposal instanceof AaveProposal && proposal.isQueueable && (
          <div class="proposal-buttons">
            <CWButton
              disabled={!proposal.isQueueable || votingModalOpen}
              onclick={() => proposal.queueTx().then(() => m.redraw())}
              label={
                proposal.data.queued || proposal.data.executed
                  ? 'Queued'
                  : 'Queue'
              }
            />
            <CWButton
              disabled={!proposal.isExecutable || votingModalOpen}
              onclick={() => proposal.executeTx().then(() => m.redraw())}
              label={proposal.data.executed ? 'Executed' : 'Execute'}
            />
            {proposal.isCancellable && (
              <AaveCancelButton
                proposal={proposal}
                votingModalOpen={votingModalOpen}
                onModalClose={onModalClose}
              />
            )}
          </div>
        )}
        {proposal instanceof CompoundProposal && proposal.isQueueable && (
          <div class="proposal-buttons">
            <CWButton
              disabled={!proposal.isQueueable || votingModalOpen}
              onclick={() => proposal.queueTx().then(() => m.redraw())}
              label={
                proposal.data.queued || proposal.data.executed
                  ? 'Queued'
                  : 'Queue'
              }
            />
            <CWButton
              disabled={!proposal.isExecutable || votingModalOpen}
              onclick={() => proposal.executeTx().then(() => m.redraw())}
              label={proposal.data.executed ? 'Executed' : 'Execute'}
            />
            <CompoundCancelButton
              proposal={proposal}
              votingModalOpen={votingModalOpen}
              onModalClose={onModalClose}
            />
          </div>
        )}
        {proposal instanceof MolochProposal && (
          <CompoundCancelButton
            proposal={proposal}
            votingModalOpen={votingModalOpen}
            onModalClose={onModalClose}
            molochMember={molochMember}
          />
        )}
      </div>
    );
  }
}
// // needs refactoring
// export class ProposalBodyLastEdited
//   implements
//     m.ClassComponent<{
//       item: Thread | Comment<any>;
//     }>
// {
//   view(vnode) {
//     const { item } = vnode.attrs;

//     const isThread = item instanceof Thread;

//     if (!item.lastEdited) {
//       return;
//     }

//     return (
//       <a
//         href="#"
//         onclick={async (e) => {
//           e.preventDefault();

//           let postWithHistory;

//           const grabHistory = isThread && !item.versionHistory?.length;

//           if (grabHistory) {
//             try {
//               postWithHistory = await app.threads.fetchThreadsFromId([item.id]);
//             } catch (err) {
//               notifyError('Version history not found.');
//               return;
//             }
//           }

//           app.modals.create({
//             modal: VersionHistoryModal,
//             data: {
//               item: grabHistory && postWithHistory ? postWithHistory : item,
//             },
//           });
//         }}
//       >
//         Edited {item.lastEdited.fromNow()}
//       </a>
//     );
//   }
// }
