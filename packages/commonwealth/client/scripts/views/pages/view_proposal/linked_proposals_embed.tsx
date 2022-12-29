/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'pages/view_proposal/linked_proposals_embed.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { ProposalType } from 'common-common/src/types';
import { idToProposal } from 'identifiers';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';

export type LinkedSubstrateProposal =
  | SubstrateDemocracyProposal
  | SubstrateDemocracyReferendum
  | SubstrateCollectiveProposal
  | SubstrateTreasuryProposal;

type LinkedProposalsEmbedAttrs = {
  proposal: LinkedSubstrateProposal;
};

export class LinkedProposalsEmbed extends ClassComponent<LinkedProposalsEmbedAttrs> {
  view(vnode: ResultNode<LinkedProposalsEmbedAttrs>) {
    const { proposal } = vnode.attrs;

    // show link to treasury proposal if this is a proposal that passes a treasury spend
    if (
      proposal instanceof SubstrateDemocracyProposal ||
      proposal instanceof SubstrateDemocracyReferendum ||
      proposal instanceof SubstrateCollectiveProposal
    ) {
      let treasuryProposalIndex;

      const call =
        proposal instanceof SubstrateDemocracyProposal
          ? proposal.preimage
          : proposal instanceof SubstrateDemocracyReferendum
          ? proposal.preimage
          : proposal instanceof SubstrateCollectiveProposal
          ? proposal.call
          : null;

      if (
        call?.section === 'treasury' &&
        (call.method === 'approveProposal' || call.method === 'rejectProposal')
      ) {
        treasuryProposalIndex = call.args[0];

        try {
          idToProposal(
            ProposalType.SubstrateTreasuryProposal,
            +treasuryProposalIndex
          );
        } catch (e) {
          // do nothing if treasury proposal was not indexed
        }
      }

      if (
        !(
          ((proposal instanceof SubstrateDemocracyProposal ||
            proposal instanceof SubstrateCollectiveProposal) &&
            proposal.getReferendum()) ||
          (proposal instanceof SubstrateDemocracyReferendum &&
            proposal.preimage &&
            proposal.getProposalOrMotion(proposal.preimage))
        )
      ) {
        return;
      }

      return (
        <div className="LinkedProposalsEmbed">
          {(proposal instanceof SubstrateDemocracyProposal ||
            proposal instanceof SubstrateCollectiveProposal) &&
            proposal.getReferendum() && (
              <React.Fragment>
                <CWText>
                  Became referendum {proposal.getReferendum().identifier}
                </CWText>
                {app.activeChainId() && (
                  <CWButton
                    buttonType="tertiary-blue"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToSubpage(
                        `/proposal/${
                          ProposalType.SubstrateDemocracyReferendum
                        }/${proposal.getReferendum().identifier}`
                      );
                    }}
                    label="Go to referendum"
                  />
                )}
              </React.Fragment>
            )}
          {proposal instanceof SubstrateDemocracyReferendum &&
            proposal.preimage &&
            proposal.getProposalOrMotion(proposal.preimage) && (
              <React.Fragment>
                <CWText>
                  Via {proposal.getProposalOrMotion(proposal.preimage).slug}{' '}
                  {proposal.getProposalOrMotion(proposal.preimage).identifier}
                </CWText>
                {app.activeChainId() && (
                  <CWButton
                    buttonType="tertiary-blue"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToSubpage(
                        `/proposal/${
                          proposal.getProposalOrMotion(proposal.preimage).slug
                        }/${
                          proposal.getProposalOrMotion(proposal.preimage)
                            .identifier
                        }`
                      );
                    }}
                    label="Go to proposal"
                  />
                )}
              </React.Fragment>
            )}
        </div>
      );
    } else if (proposal instanceof SubstrateTreasuryProposal) {
      const democracyProposals = (
        (app.chain as Substrate).democracyProposals?.store?.getAll() || []
      ).filter(
        (p) =>
          p.preimage?.section === 'treasury' &&
          (p.preimage?.method === 'approveProposal' ||
            p.preimage?.method === 'rejectProposal') &&
          p.preimage?.args[0] === proposal.identifier
      );

      const referenda = (
        (app.chain as Substrate).democracy?.store?.getAll() || []
      ).filter(
        (r) =>
          r.preimage?.section === 'treasury' &&
          (r.preimage?.method === 'approveProposal' ||
            r.preimage?.method === 'rejectProposal') &&
          r.preimage?.args[0] === proposal.identifier
      );

      const councilMotions = (
        (app.chain as Substrate).council?.store?.getAll() || []
      ).filter(
        (mo) =>
          mo.call.section === 'treasury' &&
          (mo.call.method === 'approveProposal' ||
            mo.call.method === 'rejectProposal') &&
          mo.call.args[0] === proposal.identifier
      );

      if (
        democracyProposals.length === 0 &&
        referenda.length === 0 &&
        councilMotions.length === 0
      ) {
        return;
      }

      return (
        <div className="LinkedProposalsEmbed">
          {democracyProposals.map((p) => (
            <React.Fragment>
              <CWText fontWeight="semiBold">
                Democracy Proposal ${p.shortIdentifier}
              </CWText>
              <CWText>
                {p.preimage?.method === 'approveProposal' &&
                  'Approves this proposal'}
                {p.preimage?.method === 'rejectProposal' &&
                  'Rejects this proposal'}
              </CWText>
              {app.activeChainId() && (
                <CWButton
                  buttonType="tertiary-blue"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToSubpage(
                      `/proposal/${ProposalType.SubstrateDemocracyProposal}/${p.identifier}`
                    );
                  }}
                  label="Go to democracy proposal"
                />
              )}
            </React.Fragment>
          ))}
          {referenda.map((r) => (
            <React.Fragment>
              <CWText fontWeight="semiBold">Referendum {r.identifier}</CWText>
              <CWText>
                {r.preimage?.method === 'approveProposal' &&
                  'Approves this proposal'}
                {r.preimage?.method === 'rejectProposal' &&
                  'Rejects this proposal'}
              </CWText>
              {app.activeChainId() && (
                <CWButton
                  buttonType="tertiary-blue"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToSubpage(
                      `/proposal/${ProposalType.SubstrateDemocracyReferendum}/${r.identifier}`
                    );
                  }}
                  label="Go to referendum"
                />
              )}
            </React.Fragment>
          ))}
          {councilMotions.map((mo) => (
            <React.Fragment>
              <CWText fontWeight="semiBold">
                Council Motion {mo.shortIdentifier}
              </CWText>
              <CWText>
                {mo.call?.method === 'approveProposal' &&
                  'Approves this proposal'}
                {mo.call?.method === 'rejectProposal' &&
                  'Rejects this proposal'}
              </CWText>
              {app.activeChainId() && (
                <CWButton
                  buttonType="tertiary-blue"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToSubpage(
                      `/proposal/${ProposalType.SubstrateCollectiveProposal}/${mo.identifier}`
                    );
                  }}
                  label="Go to motion"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      );
    }
  }
}
