import type { AnyProposal } from 'models/types';
import React from 'react';
import {
  getStatusClass,
  getStatusText,
} from '../../components/ProposalCard/helpers';
import { CWText } from '../../components/component_kit/cw_text';
import './proposal_components.scss';

type ProposalSubheaderProps = {
  proposal: AnyProposal;
};

export const ProposalSubheader = (props: ProposalSubheaderProps) => {
  const { proposal } = props;
  // const { data: linkedThreads } = useGetThreadsByLinkQuery({
  //   link: {
  //     source: LinkSource.Proposal,
  //     identifier: proposal.identifier,
  //   },
  //   enabled: !!proposal.identifier,
  // });

  return (
    <div className="ProposalSubheader">
      <CWText className={`onchain-status-text ${getStatusClass(proposal)}`}>
        {getStatusText(proposal)}
      </CWText>
      {/* {proposal['blockExplorerLink'] ||
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
        ))} */}
    </div>
  );
};
