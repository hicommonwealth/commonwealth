/* @jsx m */

import m from 'mithril';
import { Button } from 'construct-ui';

import 'pages/view_proposal/linked_proposals_card.scss';

import app from 'state';
import { link } from 'helpers';
import {
  chainEntityTypeToProposalSlug,
  chainEntityTypeToProposalName,
  getProposalUrlPath,
} from 'identifiers';
import { OffchainThread } from 'models';
import {
  loadMultipleSpacesData,
  SnapshotProposal,
  SnapshotSpace,
} from 'helpers/snapshot_utils';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';

class ProposalSidebarLinkedChainEntity
  implements
    m.ClassComponent<{
      proposal: OffchainThread;
      chainEntity;
    }>
{
  view(vnode) {
    const { proposal, chainEntity } = vnode.attrs;

    const slug = chainEntityTypeToProposalSlug(chainEntity.type);

    if (!slug) return;

    const proposalLink = `${
      app.isCustomDomain() ? '' : `/${proposal.chain}`
    }${getProposalUrlPath(slug, chainEntity.typeId)}`;

    return link('a', proposalLink, [
      `${chainEntityTypeToProposalName(chainEntity.type)} #${
        chainEntity.typeId
      }`,
      chainEntity.completed === 't' ? ' (Completed) ' : ' ',
    ]);
  }
}

class ProposalSidebarLinkedSnapshot
  implements
    m.ClassComponent<{
      proposal: OffchainThread;
    }>
{
  private initialized: boolean;
  private snapshot: SnapshotProposal;
  private snapshotProposalsLoaded: boolean;
  private space: SnapshotSpace;

  view(vnode) {
    const { proposal } = vnode.attrs;
    if (!proposal.snapshotProposal) return;
    if (!app.chain?.meta?.snapshot) return;

    if (!this.initialized) {
      this.initialized = true;

      loadMultipleSpacesData(app.chain.meta.snapshot).then((data) => {
        for (const { space, proposals } of data) {
          const matching_snapshot = proposals.find(
            (sn) => sn.id === proposal.snapshotProposal
          );
          if (matching_snapshot) {
            this.snapshot = matching_snapshot;
            this.space = space;
            break;
          }
        }
        this.snapshotProposalsLoaded = true;
        m.redraw();
      });
    }

    let proposalLink = '';

    if (this.space && this.snapshot) {
      proposalLink = `${
        app.isCustomDomain() ? '' : `/${proposal.chain}`
      }/snapshot/${this.space.id}/${this.snapshot.id}`;
    }

    return link('a', proposalLink, [
      `Snapshot: ${
        !this.snapshotProposalsLoaded
          ? proposal.snapshotProposal
          : this.snapshot?.title
      }`,
    ]);
  }
}

export class LinkedProposalsCard
  implements
    m.ClassComponent<{
      openStageEditor: () => void;
      proposal: OffchainThread;
      showAddProposalButton: boolean;
    }>
{
  view(vnode) {
    const { proposal, openStageEditor, showAddProposalButton } = vnode.attrs;

    return (
      <CWCard className="LinkedProposalsCard">
        {proposal.chainEntities.length > 0 ||
        proposal.snapshotProposal?.length > 0 ? (
          <CWText type="h5" className="header-text">
            Proposals for Thread
          </CWText>
        ) : (
          <CWText type="h5">
            {app.chain
              ? 'Connect an on-chain proposal?'
              : 'Track the progress of this thread?'}
          </CWText>
        )}
        <div class="links-container">
          {proposal.chainEntities.length > 0 && (
            <div class="proposal-chain-entities">
              {proposal.chainEntities.map((chainEntity) => {
                return (
                  <ProposalSidebarLinkedChainEntity
                    proposal={proposal}
                    chainEntity={chainEntity}
                  />
                );
              })}
            </div>
          )}
          {proposal.snapshotProposal?.length > 0 && (
            <ProposalSidebarLinkedSnapshot proposal={proposal} />
          )}
        </div>
        {showAddProposalButton && (
          <CWButton
            label="Connect a proposal"
            onclick={(e) => {
              e.preventDefault();
              openStageEditor();
            }}
          />
        )}
      </CWCard>
    );
  }
}
