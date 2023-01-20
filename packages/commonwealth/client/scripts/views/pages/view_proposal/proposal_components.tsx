/* @jsx m */

import ClassComponent from 'class_component';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';
import type MolochMember from 'controllers/chain/ethereum/moloch/member';

import MolochProposal from 'controllers/chain/ethereum/moloch/proposal';
import m from 'mithril';

import 'pages/view_proposal/proposal_components.scss';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import {
  getStatusClass,
  getStatusText,
} from '../../components/proposal_card/helpers';
import { cancelProposal } from '../../components/proposals/helpers';
import {
  BlockExplorerLink,
  ThreadLink,
  VotingInterfaceLink,
} from './proposal_header_links';

type BaseCancelButtonAttrs = {
  onModalClose?: () => void;
  toggleVotingModal?: (newModalState: boolean) => void;
  votingModalOpen?: boolean;
};

type MolochCancelButtonAttrs = {
  proposal: MolochProposal;
  molochMember: MolochMember;
} & BaseCancelButtonAttrs;

export class MolochCancelButton extends ClassComponent<
  MolochCancelButtonAttrs
> {
  view(vnode: m.Vnode<MolochCancelButtonAttrs>) {
    const {
      proposal,
      votingModalOpen,
      molochMember,
      onModalClose,
      toggleVotingModal,
    } = vnode.attrs;

    return (
      <CWButton
        buttonType="primary-red"
        disabled={
          !(proposal.canAbort(molochMember) && !proposal.completed) ||
          votingModalOpen
        }
        onclick={(e) =>
          cancelProposal(e, toggleVotingModal, proposal, onModalClose)
        }
        label={proposal.isAborted ? 'Cancelled' : 'Cancel'}
      />
    );
  }
}

type AaveCancelButtonAttrs = {
  proposal: AaveProposal;
} & BaseCancelButtonAttrs;

export class AaveCancelButton extends ClassComponent<AaveCancelButtonAttrs> {
  view(vnode: m.Vnode<AaveCancelButtonAttrs>) {
    const {
      proposal,
      votingModalOpen,
      onModalClose,
      toggleVotingModal,
    } = vnode.attrs;

    return (
      <CWButton
        buttonType="primary-red"
        disabled={!proposal.isCancellable || votingModalOpen}
        onclick={(e) =>
          cancelProposal(e, toggleVotingModal, proposal, onModalClose)
        }
        label={proposal.data.cancelled ? 'Cancelled' : 'Cancel'}
      />
    );
  }
}

type CompoundCancelButtonAttrs = {
  proposal: CompoundProposal;
} & BaseCancelButtonAttrs;

export class CompoundCancelButton extends ClassComponent<
  CompoundCancelButtonAttrs
> {
  view(vnode: m.Vnode<CompoundCancelButtonAttrs>) {
    const {
      proposal,
      votingModalOpen,
      onModalClose,
      toggleVotingModal,
    } = vnode.attrs;

    return (
      <CWButton
        buttonType="primary-red"
        disabled={proposal.completed || votingModalOpen}
        onclick={(e) =>
          cancelProposal(e, toggleVotingModal, proposal, onModalClose)
        }
        label={proposal.isCancelled ? 'Cancelled' : 'Cancel'}
      />
    );
  }
}

export type SubheaderProposalType =
  | AaveProposal
  | CompoundProposal
  | MolochProposal;

type ProposalSubheaderAttrs = {
  proposal: SubheaderProposalType;
  molochMember?: MolochMember;
} & BaseCancelButtonAttrs;

export class ProposalSubheader extends ClassComponent<ProposalSubheaderAttrs> {
  view(vnode: m.Vnode<ProposalSubheaderAttrs>) {
    const {
      molochMember,
      onModalClose,
      proposal,
      toggleVotingModal,
      votingModalOpen,
    } = vnode.attrs;

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

        {proposal instanceof AaveProposal && (
          <div class="proposal-buttons">
            {proposal.isQueueable && (
              <CWButton
                disabled={votingModalOpen}
                onclick={() => proposal.queueTx().then(() => m.redraw())}
                label={
                  proposal.data.queued || proposal.data.executed
                    ? 'Queued'
                    : 'Queue'
                }
              />
            )}
            {proposal.isExecutable && (
              <CWButton
                disabled={votingModalOpen}
                onclick={() => proposal.executeTx().then(() => m.redraw())}
                label={proposal.data.executed ? 'Executed' : 'Execute'}
              />
            )}
            {proposal.isCancellable && (
              <AaveCancelButton
                onModalClose={onModalClose}
                proposal={proposal}
                toggleVotingModal={toggleVotingModal}
                votingModalOpen={votingModalOpen}
              />
            )}
          </div>
        )}
        {proposal instanceof CompoundProposal && (
          <div class="proposal-buttons">
            {proposal.isQueueable && (
              <CWButton
                disabled={votingModalOpen}
                onclick={() => proposal.queueTx().then(() => m.redraw())}
                label={
                  proposal.data.queued || proposal.data.executed
                    ? 'Queued'
                    : 'Queue'
                }
              />
            )}
            {proposal.isExecutable && (
              <CWButton
                disabled={votingModalOpen}
                onclick={() => proposal.executeTx().then(() => m.redraw())}
                label={proposal.data.executed ? 'Executed' : 'Execute'}
              />
            )}
            <CompoundCancelButton
              onModalClose={onModalClose}
              proposal={proposal}
              toggleVotingModal={toggleVotingModal}
              votingModalOpen={votingModalOpen}
            />
          </div>
        )}
        {proposal instanceof MolochProposal && (
          <MolochCancelButton
            molochMember={molochMember}
            onModalClose={onModalClose}
            proposal={proposal}
            toggleVotingModal={toggleVotingModal}
          />
        )}
      </div>
    );
  }
}

// // needs refactoring
// export class ProposalBodyLastEdited
//   extends
//     ClassComponent<{
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
