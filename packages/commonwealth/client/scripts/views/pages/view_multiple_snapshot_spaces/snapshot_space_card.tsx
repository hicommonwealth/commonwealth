import React from 'react';

import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import type { Thread } from 'models';
import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';

import 'pages/snapshot/snapshot_space_card.scss';
import app from 'state';
import { REDIRECT_ACTIONS } from '.';
import { navigateToSubpage } from '../../../router';
import { CWCard } from '../../components/component_kit/cw_card';

function countActiveProposals(proposals: SnapshotProposal[]): number {
  return proposals.filter((proposal) => proposal.state === 'active').length;
}

type SnapshotSpaceCardAttrs = {
  proposal: null | Thread;
  proposals: SnapshotProposal[];
  redirectAction: string;
  space: SnapshotSpace;
};

export class SnapshotSpaceCard extends ClassComponent<SnapshotSpaceCardAttrs> {
  view(vnode: ResultNode<SnapshotSpaceCardAttrs>) {
    const { space, proposals, redirectAction, proposal } = vnode.attrs;
    if (!space || !proposals) return;

    const numActiveProposals = countActiveProposals(proposals);

    function handleClicks() {
      if (redirectAction === REDIRECT_ACTIONS.ENTER_SPACE) {
        app.snapshot.init(space.id).then(() => {
          navigateToSubpage(`/snapshot/${space.id}`);
        });
      } else if (redirectAction === REDIRECT_ACTIONS.NEW_PROPOSAL) {
        app.snapshot.init(space.id).then(() => {
          navigateToSubpage(`/new/snapshot/${space.id}`);
        });
      } else if (redirectAction === REDIRECT_ACTIONS.NEW_FROM_THREAD) {
        app.snapshot.init(space.id).then(() => {
          navigateToSubpage(
            `/new/snapshot/${app.chain.meta.snapshot}` +
              `?fromProposalType=${proposal.slug}&fromProposalId=${proposal.id}`
          );
        });
      }
    }

    return (
      <CWCard
        elevation="elevation-2"
        interactive
        className="SnapshotSpaceCard"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleClicks();
        }}
      >
        <div className="space-card-container">
          <div className="space-card-metadata">
            <div className="space-card-title">{space.name}</div>
            <div className="space-card-subheader">{space.id}</div>
          </div>
          <div className="space-card-status">
            {`${numActiveProposals} Active Proposal${
              numActiveProposals === 1 ? '' : 's'
            }`}
          </div>
        </div>
      </CWCard>
    );
  }
}
