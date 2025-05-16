import { TopicWeightedVoting, Vote } from '@hicommonwealth/schemas'; // Corrected import for Vote schema
import { APIOrderDirection } from 'helpers/constants';
import React, { Dispatch, SetStateAction, useMemo } from 'react';
import { prettyVoteWeight } from 'shared/adapters/currency';
import app from 'state';
import { CWText } from 'views/components/component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { User } from 'views/components/user/user';
import { z } from 'zod'; // Needed for z.infer
// import { downloadAsCsv } from 'helpers/csv'; // We'll need a CSV helper

import './ViewPollVotesDrawer.scss';

// Define the actual VoteAttributes type from the schema
type ActualVoteAttributes = z.infer<typeof Vote>;

// TODO: Define this more accurately based on how profile info is fetched for voters
// This might involve looking up profiles based on vote.address and vote.author_community_id
type VoterProfile = {
  name: string;
  avatarUrl?: string; // Made avatarUrl optional to match usage in PollCard
  address: string;
  // Any other relevant fields from Account/AddressInfo/MinimumProfile
};

export type VoterWithProfile = ActualVoteAttributes & {
  profile?: VoterProfile; // Voter's profile
  // calculated_voting_weight is already part of ActualVoteAttributes if schema matches
};

// Renamed from PollOptionInfo to PollOptionSummary for consistency with PollCard
// Information about each poll option, used for displaying the percentage breakdown.
export type PollOptionSummary = {
  // Renamed type
  id: string; // Corresponds to the 'option' field in a VoteAttributes object.
  text: string; // User-friendly display text for the option.
  voteCount: number; // Total number of votes for this option.
  totalWeightForOption: string | number; // Sum of voting weights for this option.
};

type ViewPollVotesDrawerProps = {
  header: string; // Drawer title, e.g., "Votes for 'Poll Question XYZ'"
  votes: VoterWithProfile[]; // Array of individual vote records, enriched with profiles.
  pollOptionsSummary: PollOptionSummary[]; // Renamed prop
  totalVoteWeightInPoll: string | number; // Overall total voting power cast in the poll.
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  tokenDecimals?: number | null | undefined;
  topicWeight?: TopicWeightedVoting | null | undefined; // For formatting vote weights
  communityId: string; // Community context, potentially for fetching profiles or other details.
  onDownloadCsv: () => void; // Callback to trigger CSV download.
  isLoading?: boolean; // To show loading state for votes
};

const getColumns = (
  tokenDecimals?: number | null,
  topicWeight?: TopicWeightedVoting | null,
): CWTableColumnInfo[] => [
  {
    key: 'voter',
    header: 'Voter',
    numeric: false,
    sortable: true,
  },
  {
    key: 'option',
    header: 'Chosen Option',
    numeric: false,
    sortable: true,
  },
  {
    key: 'voteWeight',
    header: 'Vote Weight',
    numeric: true,
    sortable: true,
    tokenDecimals,
    weightedVoting: topicWeight,
  },
  {
    key: 'timestamp',
    header: 'Timestamp',
    numeric: true,
    sortable: true,
    chronological: true,
  },
];

export const ViewPollVotesDrawer = ({
  header,
  votes,
  pollOptionsSummary, // Use renamed prop
  totalVoteWeightInPoll,
  isOpen,
  setIsOpen,
  tokenDecimals,
  topicWeight,
  communityId,
  onDownloadCsv,
  isLoading = false,
}: ViewPollVotesDrawerProps) => {
  const columns = useMemo(
    () => getColumns(tokenDecimals, topicWeight),
    [tokenDecimals, topicWeight],
  );

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'timestamp',
    initialSortDirection: APIOrderDirection.Desc, // Correctly pass APIOrderDirection.Desc
  });

  // Maps a VoterWithProfile object to the structure expected by CWTable's rowData.
  const voterRow = (vote: VoterWithProfile) => {
    // Find the display text for the chosen option.
    // vote.option from ActualVoteAttributes is the ID/value of the chosen option.
    const chosenOptionSummary = pollOptionsSummary.find(
      // Use renamed prop
      (opt) => opt.id === String(vote.option),
    );

    return {
      voter: vote.profile?.name || vote.address,
      option: chosenOptionSummary?.text || String(vote.option),
      // Ensure calculated_voting_weight is a number for the table
      voteWeight: vote.calculated_voting_weight
        ? Number(vote.calculated_voting_weight)
        : 0,
      timestamp: vote.updated_at || vote.created_at, // These should be dates or date strings
      _meta: {
        address: vote.address,
        avatarUrl: vote.profile?.avatarUrl,
      },
    };
  };

  const rowData = useMemo(() => {
    if (isLoading || !votes) return [];
    return votes.map(voterRow);
  }, [votes, pollOptionsSummary, isLoading]); // Use renamed prop in dependency array

  // Calculate percentage breakdown for display.
  const percentageBreakdown = useMemo(() => {
    const totalWeightNum = Number(totalVoteWeightInPoll);
    if (!isFinite(totalWeightNum) || totalWeightNum === 0) {
      return pollOptionsSummary.map((opt) => ({
        // Use renamed prop
        ...opt,
        percentage: '0.00%',
        voteWeightDisplay: prettyVoteWeight(
          opt.totalWeightForOption.toString(),
          tokenDecimals,
          topicWeight,
        ),
      }));
    }
    return pollOptionsSummary.map((opt) => {
      // Use renamed prop
      const optionWeightNum = Number(opt.totalWeightForOption);
      const percentage = ((optionWeightNum / totalWeightNum) * 100).toFixed(2);
      return {
        ...opt,
        percentage: `${percentage}%`,
        voteWeightDisplay: prettyVoteWeight(
          opt.totalWeightForOption.toString(),
          tokenDecimals,
          topicWeight,
        ),
      };
    });
  }, [pollOptionsSummary, totalVoteWeightInPoll, tokenDecimals, topicWeight]); // Use renamed prop

  return (
    <div className="ViewPollVotesDrawer">
      <CWDrawer
        overlayOpacity={0}
        className="poll-votes-drawer"
        open={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <CWDrawerTopBar onClose={() => setIsOpen(false)} />

        <div className="content-container">
          <div className="drawer-actions-bar">
            <button
              className="csv-download-button"
              onClick={onDownloadCsv}
              disabled={isLoading || !votes?.length}
            >
              Download CSV
            </button>
          </div>

          <CWText type="h3">{header}</CWText>

          <div className="percentage-breakdown-section">
            <CWText type="h4">Vote Breakdown</CWText>
            {percentageBreakdown.map((opt) => (
              <div key={opt.id} className="option-breakdown">
                <CWText type="b1" className="option-text">
                  {opt.text}:
                </CWText>
                <CWText type="b1" className="option-percentage">
                  {opt.percentage}
                </CWText>
                <CWText type="b2" className="option-weight">
                  ({opt.voteWeightDisplay})
                </CWText>
              </div>
            ))}
          </div>

          {isLoading ? (
            <CWText className="loading-text" type="b1">
              Loading votes...
            </CWText>
          ) : votes?.length > 0 ? (
            <>
              <CWTable
                columnInfo={tableState.columns}
                sortingState={tableState.sorting}
                setSortingState={tableState.setSorting}
                rowData={rowData.map((row) => ({
                  ...row,
                  voter: {
                    sortValue: row.voter,
                    customElement: (
                      <User
                        avatarSize={20}
                        userAddress={row._meta.address}
                        userCommunityId={communityId || app?.chain?.id || ''}
                        shouldLinkProfile
                      />
                    ),
                  },
                }))}
              />
              <div className="poll-vote-totals">
                <div className="total-votes">
                  <CWText type="caption" fontWeight="uppercase">
                    Total Votes
                  </CWText>
                  <CWText type="b2">{votes.length}</CWText>
                </div>
                <div className="total-weight">
                  <CWText type="caption" fontWeight="uppercase">
                    Total Weight
                  </CWText>
                  <CWText type="b2">
                    {prettyVoteWeight(
                      totalVoteWeightInPoll.toString(),
                      tokenDecimals,
                      topicWeight,
                      1,
                      6,
                    )}
                  </CWText>
                </div>
              </div>
            </>
          ) : (
            <CWText className="empty-votes-container" type="b1">
              There are no votes to view for this poll.
            </CWText>
          )}
        </div>
      </CWDrawer>
    </div>
  );
};
