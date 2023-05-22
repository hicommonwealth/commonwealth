import React, { useEffect } from 'react';

import app from 'state';

import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';

import 'pages/view_proposal/proposal_components.scss';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import {
  getStatusClass,
  getStatusText,
} from '../../components/proposal_card/helpers';
import { cancelProposal } from '../../components/proposals/helpers';
import { ThreadLink } from './proposal_header_links';
import useForceRerender from 'hooks/useForceRerender';
import ExternalLink from 'views/components/ExternalLink';
import { extractDomain } from 'helpers';

type BaseCancelButtonProps = {
  onModalClose?: () => void;
  toggleVotingModal?: (newModalState: boolean) => void;
  votingModalOpen?: boolean;
};

type AaveCancelButtonProps = {
  proposal: AaveProposal;
} & BaseCancelButtonProps;

export const AaveCancelButton = (props: AaveCancelButtonProps) => {
  const { proposal, votingModalOpen, onModalClose, toggleVotingModal } = props;

  return (
    <CWButton
      buttonType="primary-red"
      disabled={!proposal.isCancellable || votingModalOpen}
      onClick={(e) =>
        cancelProposal(e, toggleVotingModal, proposal, onModalClose)
      }
      label={proposal.data.cancelled ? 'Cancelled' : 'Cancel'}
    />
  );
};

type CompoundCancelButtonProps = {
  proposal: CompoundProposal;
} & BaseCancelButtonProps;

export const CompoundCancelButton = (props: CompoundCancelButtonProps) => {
  const { proposal, votingModalOpen, onModalClose, toggleVotingModal } = props;

  return (
    <CWButton
      buttonType="primary-red"
      disabled={proposal.completed || votingModalOpen}
      onClick={(e) =>
        cancelProposal(e, toggleVotingModal, proposal, onModalClose)
      }
      label={proposal.isCancelled ? 'Cancelled' : 'Cancel'}
    />
  );
};

export type SubheaderProposalType = AaveProposal | CompoundProposal;

type ProposalSubheaderProps = {
  proposal: SubheaderProposalType;
} & BaseCancelButtonProps;

export const ProposalSubheader = (props: ProposalSubheaderProps) => {
  const { onModalClose, proposal, toggleVotingModal, votingModalOpen } = props;
  const forceRerender = useForceRerender();

  useEffect(() => {
    app.proposalEmitter.on('redraw', forceRerender);

    return () => {
      app.proposalEmitter.removeAllListeners();
    };
  }, [forceRerender]);

  return (
    <div className="ProposalSubheader">
      <CWText className={`onchain-status-text ${getStatusClass(proposal)}`}>
        {getStatusText(proposal)}
      </CWText>
      {(proposal['blockExplorerLink'] ||
        proposal['votingInterfaceLink'] ||
        proposal.threadId) && (
        <div className="proposal-links">
          {proposal.threadId && <ThreadLink proposal={proposal} />}
          {proposal['blockExplorerLink'] && (
            <ExternalLink url={proposal['blockExplorerLink']}>
              {proposal['blockExplorerLinkLabel'] ||
                extractDomain(proposal['blockExplorerLink'])}
            </ExternalLink>
          )}
          {proposal['votingInterfaceLink'] && (
            <ExternalLink url={proposal['votingInterfaceLink']}>
              {proposal['votingInterfaceLinkLabel'] ||
                extractDomain(proposal['votingInterfaceLink'])}
            </ExternalLink>
          )}
        </div>
      )}

      {proposal instanceof AaveProposal && (
        <div className="proposal-buttons">
          {proposal.isQueueable && (
            <CWButton
              disabled={votingModalOpen}
              onClick={() => proposal.queueTx()}
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
              onClick={() => proposal.executeTx()}
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
        <div className="proposal-buttons">
          {proposal.isQueueable && (
            <CWButton
              disabled={votingModalOpen}
              onClick={() => proposal.queueTx()}
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
              onClick={() => proposal.executeTx()}
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
    </div>
  );
};
