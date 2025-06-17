import { ChainBase } from '@hicommonwealth/shared';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getContestScore,
  getContestStatus,
  getPrizeVaultBalance,
} from 'helpers/SolanaContractHelpers/solanaContest';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useGetContestsQuery } from 'state/api/contests';
import { useCommunityStake } from 'views/components/CommunityStake';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';
import { isContestActive } from './utils';

type UseCommunityContestsProps =
  | {
      shouldPolling?: boolean;
      fetchAll?: boolean;
      isCommunityHomePage?: boolean;
    }
  | undefined;

const useCommunityContests = (props?: UseCommunityContestsProps) => {
  const {
    shouldPolling = false,
    fetchAll = false,
    isCommunityHomePage = false,
  } = props || {};
  const { stakeEnabled } = useCommunityStake();
  const [solanaContestsData, setSolanaContestsData] = useState<
    Record<
      string,
      {
        balance: number;
        score: any;
        status?: {
          startTime: number;
          endTime: number;
          contestInterval: number;
        };
      }
    >
  >({});

  const { data: contestsData, isLoading: isContestDataLoading } =
    useGetContestsQuery({
      community_id: app.activeChainId() || '',
      shouldPolling,
      fetchAll,
    });

  // If we're on the community homepage, also fetch global contests (i.e. without filtering by community_id)
  // NOTE: This query will always run when isCommunityHomepage is true.
  const { data: globalContestsData, isLoading: isGlobalContestsLoading } =
    useGetContestsQuery({
      community_id: '',
      shouldPolling,
      fetchAll: true,
    });

  // Fetch on-chain data for Solana contests
  useEffect(() => {
    // Only run if there are contests and we're on a Solana chain
    if (!contestsData || app?.chain?.base !== ChainBase.Solana) return;

    const fetchSolanaContestData = async () => {
      const newSolanaData: Record<
        string,
        {
          balance: number;
          score: any;
          status?: {
            startTime: number;
            endTime: number;
            contestInterval: number;
          };
        }
      > = {};

      // Filter for Solana contests with no contests array entries
      const solanaContests = contestsData.filter(
        (contest) =>
          contest.community_id === app?.chain?.id &&
          (!contest.contests || contest.contests.length === 0),
      );

      // If no Solana contests found, don't proceed
      if (solanaContests.length === 0) return;

      try {
        // Create Solana connection
        const connectionUrl = 'https://api.devnet.solana.com';
        const connection = new Connection(connectionUrl, 'confirmed');

        // Fetch data for each Solana contest
        for (const contest of solanaContests) {
          try {
            if (!contest.contest_address) continue;

            // Create default data in case fetch fails
            newSolanaData[contest.contest_address] = {
              balance: 0,
              score: {
                isContestEnded: false,
                winners: [],
                totalPrize: 0,
                protocolFee: 0,
              },
            };

            // Try to fetch on-chain data but don't throw if account doesn't exist
            try {
              const contestPda = new PublicKey(contest.contest_address);

              // Get prize vault balance (for contest_balance)
              const balanceResult = await getPrizeVaultBalance(
                connection,
                contestPda,
              );

              // Get contest score (for winners, etc.)
              const scoreResult = await getContestScore(connection, contestPda);

              // Get contest status (for accurate start/end times)
              const statusResult = await getContestStatus(
                connection,
                contestPda,
              );

              // Update with real data if successful
              newSolanaData[contest.contest_address] = {
                balance: balanceResult.balance,
                score: scoreResult,
                status: {
                  startTime: statusResult.startTime,
                  endTime: statusResult.endTime,
                  contestInterval: statusResult.contestInterval,
                },
              };
            } catch (blockchainError) {
              // Silently continue with default data if account doesn't exist
              // This allows the contest to still be displayed using synthetic data
              if (blockchainError.message?.includes('Account does not exist')) {
                // Already initialized with default values above
              } else {
                // Log other unexpected errors but don't disrupt the UI
                console.warn(
                  `Error fetching on-chain data for ${contest.contest_address}:`,
                  blockchainError.message,
                );
              }
            }
          } catch (error) {
            console.error(
              `Error processing contest ${contest.contest_address}:`,
              error,
            );
          }
        }

        setSolanaContestsData(newSolanaData);
      } catch (error) {
        console.error('Error setting up Solana connection:', error);
      }
    };

    fetchSolanaContestData();
  }, [contestsData, app?.chain?.id, app?.chain?.base]);

  const { finishedContests, activeContests } = useMemo(() => {
    const finished: Contest[] = [];
    const active: Contest[] = [];

    (contestsData || []).forEach((contest) => {
      // Check if this is a Solana contest with no Contests table entry
      const isSolanaContest =
        app?.chain?.base === ChainBase.Solana &&
        app?.chain?.id === contest.community_id;

      // For Solana contests that have no entries in the Contests table,
      // use real data from the blockchain if available
      if (
        isSolanaContest &&
        (!contest.contests || contest.contests.length === 0)
      ) {
        // Create a real contest entry with blockchain data if available, otherwise use defaults
        const solanaData = contest.contest_address
          ? solanaContestsData[contest.contest_address]
          : undefined;

        // Determine start and end times
        let startTime, endTime;

        if (solanaData?.status) {
          // Use on-chain data for times if available
          startTime = new Date(solanaData.status.startTime * 1000); // Convert from Unix timestamp
          endTime = new Date(solanaData.status.endTime * 1000); // Convert from Unix timestamp
        } else {
          // Fallback to created_at or current date if no blockchain data
          startTime = new Date(contest.created_at || new Date());
          endTime = new Date(startTime);

          // For fallback data, if contest is ended use a past date, otherwise use future date
          if (solanaData?.score?.isContestEnded) {
            endTime.setDate(endTime.getDate() - 1); // Contest ended
          } else {
            endTime.setDate(endTime.getDate() + 30); // Default 30 day contest
          }
        }

        // Create contest data combining DB and on-chain information
        const contestData = {
          contest_id: 1,
          start_time: startTime,
          end_time: endTime,
          // Use real score data if available
          score:
            solanaData?.score?.winners?.map((winner) => ({
              creator_address: winner.creator,
              content_id: winner.contentUrl,
              votes: winner.votes,
              prize: String(winner.prizeAmount),
              tickerPrize:
                winner.prizeAmount / Math.pow(10, contest.decimals || 0),
            })) || [],
          // Use real balance data if available
          contest_balance: solanaData?.balance
            ? String(solanaData.balance)
            : '0',
        };

        // Check if this contest is active - use on-chain data if available
        const isActive =
          solanaData?.score?.isContestEnded !== undefined
            ? !solanaData.score.isContestEnded && !contest.cancelled
            : isContestActive({
                contest: {
                  cancelled: !!contest.cancelled,
                  contests: [{ end_time: contestData.end_time }],
                },
              });

        if (isActive) {
          active.push({
            ...contest,
            contests: [contestData],
          } as unknown as Contest);
        } else {
          finished.push({
            ...contest,
            contests: [contestData],
          } as unknown as Contest);
        }

        // Skip the rest of the processing for this contest
        return;
      }

      const tempFinishedContests: Pick<Contest, 'contests'>[] = [];
      const tempActiveContests: Pick<Contest, 'contests'>[] = [];

      (contest?.contests || []).map((c) => {
        const end_time = c.end_time || null;

        const isActive = end_time
          ? isContestActive({
              contest: {
                cancelled: !!contest.cancelled,
                contests: [{ end_time: new Date(end_time) }],
              },
            })
          : false;

        if (!isActive) {
          tempFinishedContests.push(c as Pick<Contest, 'contests'>);
        } else {
          tempActiveContests.push(c as Pick<Contest, 'contests'>);
        }
      });

      // Sort active contests by end_date and prize amount
      tempActiveContests.sort((a, b) => {
        const aEndTime = moment(a.contests?.[0]?.end_time);
        const bEndTime = moment(b.contests?.[0]?.end_time);

        if (aEndTime.isSame(bEndTime)) {
          const aAmount = Number(a.contests?.[0]?.score?.[0]?.prize) || 0;
          const bAmount = Number(b.contests?.[0]?.score?.[0]?.prize) || 0;
          return bAmount - aAmount;
        }

        return aEndTime.diff(bEndTime);
      });

      // Sort finished contests by end date (descending)
      tempFinishedContests.sort((a, b) => {
        const aEndTime = moment(a.contests?.[0]?.end_time);
        const bEndTime = moment(b.contests?.[0]?.end_time);
        return bEndTime.diff(aEndTime);
      });

      if (tempActiveContests.length > 0) {
        active.push({
          ...contest,
          contests: tempActiveContests,
        } as unknown as Contest);
      }

      if (tempFinishedContests.length > 0) {
        finished.push({
          ...contest,
          contests: tempFinishedContests,
        } as unknown as Contest);
      }
    });

    return {
      finishedContests: finished,
      activeContests: active,
    };
  }, [contestsData, solanaContestsData]);

  // Process global contests similarly to return only active contests.
  const globalActiveContests = useMemo(() => {
    const active: Contest[] = [];
    (globalContestsData || []).forEach((contest) => {
      // Check if this is a Solana contest with no Contests table entry
      const isSolanaContest =
        contest.community_id && contest.community_id.includes('solana');

      // For Solana contests that have no entries in the Contests table,
      // use real data from the blockchain if available
      if (
        isSolanaContest &&
        (!contest.contests || contest.contests.length === 0)
      ) {
        // Since we're on global view, we don't fetch blockchain data for every contest
        // But we can still create a reasonable entry to display

        // For global view, we use a simple approximation of contest timing
        // If we wanted real data, we would need to fetch it separately for each contest
        const createdAt = contest.created_at || new Date();
        const syntheticEndTime = new Date(createdAt);

        // Default to 30 days, but this could be improved by fetching real data
        syntheticEndTime.setDate(syntheticEndTime.getDate() + 30);

        // Create contest data - for global view we use simplified data
        const contestData = {
          contest_id: 1,
          start_time: new Date(createdAt),
          end_time: syntheticEndTime,
          score: [],
          contest_balance: '0',
        };

        // Check if this contest is active - for global view, we assume active
        // To get real data, we would need to make RPC calls to Solana for each contest
        const isActive = isContestActive({
          contest: {
            cancelled: !!contest.cancelled,
            contests: [{ end_time: syntheticEndTime }],
          },
        });

        if (isActive) {
          active.push({
            ...contest,
            contests: [contestData],
          } as unknown as Contest);
        }

        // Skip the rest of the processing for this contest
        return;
      }

      const tempActiveContests: Pick<Contest, 'contests'>[] = [];
      (contest?.contests || []).forEach((c) => {
        const end_time = c.end_time || null;
        const isActive = end_time
          ? isContestActive({
              contest: {
                cancelled: !!contest.cancelled,
                contests: [{ end_time: new Date(end_time) }],
              },
            })
          : false;
        if (isActive) {
          tempActiveContests.push(c as Pick<Contest, 'contests'>);
        }
      });

      // Sort active contests by end time (ascending) and prize amount (descending when times are equal)
      tempActiveContests.sort((a, b) => {
        const aEndTime = moment(a.contests?.[0]?.end_time);
        const bEndTime = moment(b.contests?.[0]?.end_time);
        if (aEndTime.isSame(bEndTime)) {
          const aAmount = Number(a.contests?.[0]?.score?.[0]?.prize) || 0;
          const bAmount = Number(b.contests?.[0]?.score?.[0]?.prize) || 0;
          return bAmount - aAmount;
        }
        return aEndTime.diff(bEndTime);
      });
      if (tempActiveContests.length > 0) {
        active.push({
          ...contest,
          contests: tempActiveContests,
        } as unknown as Contest);
      }
    });
    return active;
  }, [globalContestsData]);

  // If we're on the community homepage and there are no active contests,
  // we determine that we should show suggested contests.
  const isSuggestedMode =
    isCommunityHomePage &&
    activeContests.length === 0 &&
    !!globalContestsData &&
    !isGlobalContestsLoading;

  // @ts-expect-error StrictNullChecks
  const isContestAvailable = !isContestDataLoading && contestsData?.length > 0;

  const getContestByAddress = (contestAddress: string) => {
    return contestsData?.find(
      (contest) => contest.contest_address === contestAddress,
    );
  };

  return {
    stakeEnabled,
    isContestAvailable,
    contestsData: {
      all: contestsData as unknown as Contest[],
      finished: finishedContests,
      active: activeContests,
      suggested: globalActiveContests,
    },
    isContestDataLoading: isContestDataLoading,
    getContestByAddress,
    isSuggestedMode,
  };
};

export default useCommunityContests;
