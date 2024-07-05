import axios from 'axios';
import { userStore } from 'client/scripts/state/ui/user';
import { extractDomain } from 'helpers';
import useForceRerender from 'hooks/useForceRerender';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { LinkSource } from 'models/Thread';
import type { AnyProposal } from 'models/types';
import 'pages/view_proposal/proposal_components.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import ExternalLink from 'views/components/ExternalLink';
import {
  getStatusClass,
  getStatusText,
} from '../../components/ProposalCard/helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { ThreadLink } from './proposal_header_links';

type ProposalSubheaderProps = {
  proposal: AnyProposal;
};

export const ProposalSubheader = (props: ProposalSubheaderProps) => {
  const { proposal } = props;
  const forceRerender = useForceRerender();
  const [linkedThreads, setLinkedThreads] =
    // @ts-expect-error <StrictNullChecks/>
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
          jwt: userStore.getState().jwt,
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
    </div>
  );
};
