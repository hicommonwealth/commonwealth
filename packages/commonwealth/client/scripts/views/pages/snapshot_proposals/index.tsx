import React from 'react';

import moment from 'moment';
import type { SnapshotProposal } from 'helpers/snapshot_utils';

import 'pages/snapshot_proposals.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import { CardsCollection } from '../../components/cards_collection';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { SnapshotProposalCard } from './snapshot_proposal_card';
import { PageLoading } from '../loading';
import { MixpanelSnapshotEvents } from 'analytics/types';
import { mixpanelBrowserTrack } from '../../../helpers/mixpanel_browser_util';

export const ALL_PROPOSALS_KEY = 'COMMONWEALTH_ALL_PROPOSALS';

enum SnapshotProposalFilter {
  Core = 'Core',
  Community = 'Community',
  Active = 'Active',
  Ended = 'Ended',
}

type SnapshotProposalStagesBarProps = {
  onChangeFilter: (value: SnapshotProposalFilter) => void;
};

const SnapshotProposalStagesBar = (props: SnapshotProposalStagesBarProps) => {
  const { onChangeFilter } = props;

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
              onChangeFilter(option);
            }}
            label={option}
          />
        )
      )}
    </div>
  );
};

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

type SnapshotProposalsPageProps = {
  topic?: string;
  snapshotId: string;
};

const SnapshotProposalsPage = (props: SnapshotProposalsPageProps) => {
  const { snapshotId } = props;

  const [proposals, setProposals] = React.useState<Array<SnapshotProposal>>([]);
  const [selectedFilter, setSelectedFilter] =
    React.useState<SnapshotProposalFilter>(SnapshotProposalFilter.Active);

  React.useEffect(() => {
    const fetch = async () => {
      await app.snapshot.init(snapshotId);

      if (app.snapshot.initialized) {
        setProposals(app.snapshot.proposals);
      }
    };

    fetch();
  }, [snapshotId]);

  const onChangeFilter = (value: SnapshotProposalFilter) => {
    setSelectedFilter(value);
  };

  return (
    <Sublayout>
      <div className="SnapshotProposalsPage">
        <SnapshotProposalStagesBar onChangeFilter={onChangeFilter} />
        {proposals.length > 0 ? (
          <CardsCollection
            content={proposals
              .filter((proposal: SnapshotProposal) =>
                checkProposalByFilter(proposal, selectedFilter)
              )
              .map((proposal, i) => (
                <SnapshotProposalCard
                  key={i}
                  snapshotId={snapshotId}
                  proposal={proposal}
                />
              ))}
          />
        ) : (
          <CWText className="no-proposals-text">
            No {selectedFilter.toLowerCase()} proposals found.
          </CWText>
        )}
      </div>
    </Sublayout>
  );
};

export default SnapshotProposalsPage;
