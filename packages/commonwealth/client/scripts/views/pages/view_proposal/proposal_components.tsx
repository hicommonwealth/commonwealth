import axios from 'axios';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';
import { extractDomain } from 'helpers';
import useForceRerender from 'hooks/useForceRerender';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { LinkSource } from 'models/Thread';
import 'pages/view_proposal/proposal_components.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import ExternalLink from 'views/components/ExternalLink';
import {
  getStatusClass,
  getStatusText,
} from '../../components/ProposalCard/helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { cancelProposal } from '../../components/proposals/helpers';
import { ThreadLink } from './proposal_header_links';

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
      buttonType="destructive"
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
      buttonType="destructive"
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
  const [linkedThreads, setLinkedThreads] =
    useState<{ id: number; title: string }[]>(null);

  useEffect(() => {
    app.proposalEmitter.on('redraw', forceRerender);

    return () => {
      app.proposalEmitter.removeAllListeners();
    };
  }, [forceRerender]);

  useNecessaryEffect(() => {
    if (!linkedThreads) {
      axios
        .post(`${app.serverUrl()}/linking/getLinks`, {
          link: {
            source: LinkSource.Proposal,
            identifier: proposal.identifier,
          },
          jwt: app.user.jwt,
        })
        .then((response) => {
          setLinkedThreads(response.data.result.threads);
        });
    }
  }, []);

  return (
    <div className="ProposalSubheader">
      <CWText className={`onchain-status-text ${getStatusClass(proposal)}`}>
        {getStatusText(proposal)}
      </CWText>
      {proposal['blockExplorerLink'] ||
        proposal['votingInterfaceLink'] ||
        (linkedThreads && (
          <div className="proposal-links">
            {linkedThreads && (
              <ThreadLink
                threads={linkedThreads}
                community={proposal['chain']}
              />
            )}
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
        ))}

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
              label={proposal.queued || proposal.executed ? 'Queued' : 'Queue'}
            />
          )}
          {proposal.isExecutable && (
            <CWButton
              disabled={votingModalOpen}
              onClick={() => proposal.executeTx()}
              label={proposal.executed ? 'Executed' : 'Execute'}
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
