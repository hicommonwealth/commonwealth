/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import moment from 'moment';

import 'pages/snapshot_proposals.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { MixpanelSnapshotEvents } from 'analytics/types';

import { SnapshotProposal } from 'helpers/snapshot_utils';
import { PageLoading } from '../loading';
import { SnapshotProposalCard } from './snapshot_proposal_card';
import { CardsCollection } from '../../components/cards_collection';
import { mixpanelBrowserTrack } from '../../../helpers/mixpanel_browser_util';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

enum SnapshotProposalFilter {
  Core = 'Core',
  Community = 'Community',
  Active = 'Active',
  Ended = 'Ended',
}

type SnapshotProposalStagesBarAttrs = {
  selected: SnapshotProposalFilter;
  onChangeFilter: (value: SnapshotProposalFilter) => void;
};

class SnapshotProposalStagesBar extends ClassComponent<SnapshotProposalStagesBarAttrs> {
  view(vnode: ResultNode<SnapshotProposalStagesBarAttrs>) {
    return (
      <div className="SnapshotProposalStagesBar">
        {Object.values(SnapshotProposalFilter).map(
          (option: SnapshotProposalFilter, i) => (
            <CWButton
              key={i}
              disabled={
                option === SnapshotProposalFilter.Core ||
                option === SnapshotProposalFilter.Community
              }
              onClick={(e) => {
                e.preventDefault();
                vnode.attrs.onChangeFilter(option);
              }}
              label={option}
            />
          )
        )}
      </div>
    );
  }
}

type SnapshotProposalsPageAttrs = {
  topic?: string;
  snapshotId: string;
};

class SnapshotProposalsPage extends ClassComponent<SnapshotProposalsPageAttrs> {
  private selectedFilter: SnapshotProposalFilter;

  oncreate() {
    this.selectedFilter = SnapshotProposalFilter.Active;
    // mixpanelBrowserTrack({
    //   event: MixpanelSnapshotEvents.SNAPSHOT_PAGE_VISIT,
    //   isCustomDomain: app.isCustomDomain(),
    // });
  }

  view(vnode: ResultNode<SnapshotProposalsPageAttrs>) {
    const { selectedFilter } = this;
    const { snapshotId } = vnode.attrs;

    if (!app.snapshot.initialized || app.snapshot?.space?.id !== snapshotId) {
      app.snapshot.init(snapshotId).then(() => {
        redraw();
      });

      return <PageLoading />;
    }

    const checkProposalByFilter = (
      proposal: SnapshotProposal,
      option: SnapshotProposalFilter
    ) => {
      switch (option) {
        case SnapshotProposalFilter.Core:
        case SnapshotProposalFilter.Community:
          return true;
        case SnapshotProposalFilter.Active:
          return moment(+proposal.end * 1000) >= moment();
        case SnapshotProposalFilter.Ended:
          return moment(+proposal.end * 1000) < moment();
        default:
          break;
      }
      return true;
    };

    const proposals = app.snapshot.proposals.filter(
      (proposal: SnapshotProposal) =>
        checkProposalByFilter(proposal, selectedFilter)
    );

    const onChangeFilter = (value: SnapshotProposalFilter) => {
      this.selectedFilter = value;
    };

    return (
      <Sublayout
      // title="Proposals"
      >
        {app.chain && (
          <div className="SnapshotProposalsPage">
            <SnapshotProposalStagesBar
              selected={selectedFilter}
              onChangeFilter={onChangeFilter}
            />
            {proposals.length > 0 ? (
              <CardsCollection
                content={proposals.map((proposal, i) => (
                  <SnapshotProposalCard
                    key={i}
                    snapshotId={snapshotId}
                    proposal={proposal}
                  />
                ))}
              />
            ) : (
              <CWText className="no-proposals-text">
                No {this.selectedFilter.toLowerCase()} proposals found.
              </CWText>
            )}
          </div>
        )}
      </Sublayout>
    );
  }
}

export default SnapshotProposalsPage;
