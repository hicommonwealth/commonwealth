import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { SingleContest } from '../../solanaTypes/single_contest';

// Define constants from Rust program
const CONTEST_SEED = 'contest';
const CONTENT_SEED = 'content';
const VOTE_SEED = 'vote';
const VAULT_SEED = 'vault';
const MAX_URL_LENGTH = 100;
const BASIS_POINTS_PER_100_PERCENT = 10000;

// Program ID from IDL
const PROGRAM_ID = new PublicKey(
  'Emx5wMhCNPULbwyY5SJpFVr1UFpgyPqugtkNvMUBoh9n',
);
// Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
); // Helper to get program instance
const getProgram = (
  connection: Connection,
  wallet?: anchor.Wallet,
): Program<SingleContest> => {
  // Create a provider with or without a wallet
  const provider = wallet
    ? new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
    : new AnchorProvider(
        connection,
        {
          publicKey: PublicKey.default,
          signTransaction: async () => {
            throw new Error('Wallet not provided');
          },
          signAllTransactions: async () => {
            throw new Error('Wallet not provided');
          },
        },
        { commitment: 'confirmed' },
      );

  // Import the IDL directly to avoid TypeScript errors
  const idl = require('../../SolanaIDLs/Devnet/single_contest.json');

  // Create the program from the IDL
  return new Program(idl, PROGRAM_ID, provider);
};

// Helper to derive contest PDA
export const findContestPDA = (
  authority: PublicKey,
  seed: number = 1,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(CONTEST_SEED),
      authority.toBuffer(),
      Buffer.from([seed]), // Single byte seed
    ],
    PROGRAM_ID,
  );
};

// Helper to derive prize vault PDA
export const findPrizeVaultPDA = (
  contestPDA: PublicKey,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED), contestPDA.toBuffer()],
    PROGRAM_ID,
  );
};

// Helper to derive content PDA
export const findContentPDA = (
  contestPDA: PublicKey,
  contentId: number,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(CONTENT_SEED),
      contestPDA.toBuffer(),
      new BN(contentId).toArrayLike(Buffer, 'le', 8),
    ],
    PROGRAM_ID,
  );
};

// Helper to derive vote record PDA
export const findVoteRecordPDA = (
  contentPDA: PublicKey,
  voter: PublicKey,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VOTE_SEED), contentPDA.toBuffer(), voter.toBuffer()],
    PROGRAM_ID,
  );
};

/**
 * Gets the total balance of the prize vault for a contest
 * @param contestAddress The address of the contest
 * @param connection Solana connection
 * @returns Contest balance as a string
 */
export const getTotalContestBalance = async (
  contestAddress: string,
  connection: Connection,
): Promise<string> => {
  const contestPDA = new PublicKey(contestAddress);
  const [prizeVaultPDA] = findPrizeVaultPDA(contestPDA);

  try {
    // Use getTokenAccountBalance from web3.js
    const tokenBalance = await connection.getTokenAccountBalance(prizeVaultPDA);
    return tokenBalance.value.amount;
  } catch (error) {
    console.error('Error fetching contest balance:', error);
    return '0';
  }
};

/**
 * Gets relevant contest state information
 * @param connection Solana connection
 * @param contest The address of the contest
 * @returns Contest Status object
 */
export const getContestStatus = async (
  connection: Connection,
  contest: string,
): Promise<{
  startTime: number;
  endTime: number;
  contestInterval: number;
  lastContentId: string;
  prizeShare: number;
  voterShare: number;
  contestToken: string;
}> => {
  const program = getProgram(connection);
  const contestPDA = new PublicKey(contest);

  try {
    const contestAccount = await program.account.contest.fetch(contestPDA);

    // Calculate the contest interval (end time - start time)
    // Anchor transforms snake_case to camelCase in JavaScript/TypeScript
    const contestInterval = contestAccount.endTime
      .sub(contestAccount.startTime)
      .toNumber();

    // Get the protocol fee percentage and invert to get prize share
    const protocolFeePercentage = contestAccount.protocolFeePercentage;
    const prizeShare = BASIS_POINTS_PER_100_PERCENT - protocolFeePercentage;

    // The Solana program doesn't have a direct voterShare concept like EVM
    // We'll set it to 0 since all voting power comes from token balance
    const voterShare = 0;

    return {
      startTime: contestAccount.startTime.toNumber(),
      endTime: contestAccount.endTime.toNumber(),
      contestInterval: contestInterval,
      lastContentId: contestAccount.contentCount.toString(),
      prizeShare: prizeShare,
      voterShare: voterShare,
      contestToken: contestAccount.prizeMint.toString(),
    };
  } catch (error) {
    console.error('Error fetching contest status:', error);
    throw error;
  }
};

/**
 * Get the total balance of a given contest
 * @param connection Solana connection
 * @param contest The address of contest to get the balance of
 * @returns A numeric contest balance of the contestToken
 */
export const getContestBalance = async (
  connection: Connection,
  contest: string,
): Promise<string> => {
  return getTotalContestBalance(contest, connection);
};

/**
 * Gets vote and more information about winners of a given contest
 * @param connection Solana connection
 * @param contest The address of the contest
 * @param getCurrentScores Whether to get current scores before contest end
 * @returns Contest balance and ContestScores object containing content ids, creator addresses, and votes
 */
export const getContestScore = async (
  connection: Connection,
  contest: string,
  getCurrentScores: boolean = false,
): Promise<{
  contestBalance: string | null;
  scores: {
    content_id: string;
    creator_address: string;
    votes: string;
    prize: string;
  }[];
}> => {
  const program = getProgram(connection);
  const contestPDA = new PublicKey(contest);

  try {
    const contestAccount = await program.account.contest.fetch(contestPDA);
    const contestBalance = await getTotalContestBalance(contest, connection);

    // Get all content accounts for this contest
    const contentAccounts = await program.account.content.all([
      {
        memcmp: {
          offset: 8, // Skip discriminator
          bytes: contestPDA.toBase58(),
        },
      },
    ]);

    // Sort the content accounts based on votes or by winner order
    let sortedContent = contentAccounts;

    if (!getCurrentScores && contestAccount.contestEnded) {
      // Contest has ended, use the winner IDs array to order content
      const winnerIds = contestAccount.winnerIds.map((id) => id.toNumber());
      sortedContent = winnerIds
        .map((id) => {
          return contentAccounts.find(
            (content) => content.account.id.toNumber() === id,
          );
        })
        .filter(Boolean) as typeof contentAccounts;
    } else {
      // Contest is ongoing or we want current scores, sort by votes
      sortedContent = contentAccounts.sort((a, b) =>
        b.account.cumulativeVotes.cmp(a.account.cumulativeVotes),
      );
    }

    // Calculate prizes if contest has ended
    const scores = sortedContent.map((content, index) => {
      let prize = '0';

      if (
        contestAccount.contestEnded &&
        index < contestAccount.winnerShares.length
      ) {
        // Only calculate prize for winners (based on index in winner_shares)
        const sharePercentage = contestAccount.winnerShares[index];
        const totalPrize = contestAccount.totalPrize;
        prize = new BN(
          (totalPrize.toNumber() * sharePercentage) /
            BASIS_POINTS_PER_100_PERCENT,
        ).toString();
      }

      return {
        content_id: content.account.id.toString(),
        creator_address: content.account.creator.toString(),
        votes: content.account.cumulativeVotes.toString(),
        prize: prize,
      };
    });

    return {
      contestBalance: contestBalance,
      scores: scores,
    };
  } catch (error) {
    console.error('Error fetching contest scores:', error);
    return {
      contestBalance: null,
      scores: [],
    };
  }
};

export type AddContentResponse = {
  signature: string;
  contentId: string;
};

/**
 * Adds content to a contest
 * @param connection Solana connection
 * @param wallet Anchor wallet instance
 * @param contest Contest address
 * @param creator Creator address
 * @param url Content URL
 * @returns Transaction signature and content ID
 */
export const addContent = async (
  connection: Connection,
  wallet: anchor.Wallet,
  contest: string,
  creator: string,
  url: string,
): Promise<AddContentResponse> => {
  const program = getProgram(connection, wallet);
  const contestPDA = new PublicKey(contest);
  const creatorPubkey = new PublicKey(creator);

  try {
    // Get current content count to derive the next content PDA
    const contestAccount = await program.account.contest.fetch(contestPDA);
    const contentId = contestAccount.contentCount.toNumber();

    const [contentPDA] = findContentPDA(contestPDA, contentId);

    // Anchor uses camelCase in TypeScript/JavaScript for account fields
    const signature = await program.methods
      .addContent(url)
      .accounts({
        contest: contestPDA,
        content: contentPDA,
        authority: wallet.publicKey,
        creator: creatorPubkey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    return {
      signature,
      contentId: contentId.toString(),
    };
  } catch (error) {
    console.error('Error adding content:', error);
    throw error;
  }
};

/**
 * Vote for content in a contest
 * @param connection Solana connection
 * @param wallet Anchor wallet instance
 * @param contest Contest address
 * @param voter Voter address
 * @param contentId Content ID to vote for
 * @returns Transaction signature
 */
export const voteContent = async (
  connection: Connection,
  wallet: anchor.Wallet,
  contest: string,
  voter: string,
  contentId: string,
): Promise<string> => {
  const program = getProgram(connection, wallet);
  const contestPDA = new PublicKey(contest);
  const voterPubkey = new PublicKey(voter);

  try {
    // Find the content PDA
    const [contentPDA] = findContentPDA(contestPDA, parseInt(contentId));

    // Find the vote record PDA
    const [voteRecordPDA] = findVoteRecordPDA(contentPDA, voterPubkey);

    // Get voter's token account for the contest token
    const voterTokenAccount = await connection.getTokenAccountsByOwner(
      voterPubkey,
      {
        programId: TOKEN_PROGRAM_ID,
      },
    );

    if (voterTokenAccount.value.length === 0) {
      throw new Error('Voter has no token accounts');
    }

    // Anchor uses camelCase in TypeScript/JavaScript for account fields
    const signature = await program.methods
      .voteContent()
      .accounts({
        contest: contestPDA,
        content: contentPDA,
        voteRecord: voteRecordPDA,
        authority: wallet.publicKey,
        voter: voterPubkey,
        voterTokenAccount: voterTokenAccount.value[0].pubkey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    return signature;
  } catch (error) {
    console.error('Error voting for content:', error);
    throw error;
  }
};

/**
 * Deposit prize tokens to a contest
 * @param connection Solana connection
 * @param wallet Anchor wallet instance
 * @param contest Contest address
 * @param amount Amount to deposit
 * @returns Transaction signature
 */
export const depositPrize = async (
  connection: Connection,
  wallet: anchor.Wallet,
  contest: string,
  amount: string,
): Promise<string> => {
  const program = getProgram(connection, wallet);
  const contestPDA = new PublicKey(contest);

  try {
    // Find the prize vault PDA
    const [prizeVaultPDA] = findPrizeVaultPDA(contestPDA);

    // Get depositor's token account
    const depositorTokenAccounts = await connection.getTokenAccountsByOwner(
      wallet.publicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      },
    );

    if (depositorTokenAccounts.value.length === 0) {
      throw new Error('Depositor has no token accounts');
    }

    // Anchor uses camelCase in TypeScript/JavaScript for account fields
    const signature = await program.methods
      .depositPrize(new BN(amount))
      .accounts({
        contest: contestPDA,
        prizeVault: prizeVaultPDA,
        depositor: wallet.publicKey,
        depositorTokenAccount: depositorTokenAccounts.value[0].pubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return signature;
  } catch (error) {
    console.error('Error depositing prize tokens:', error);
    throw error;
  }
};

/**
 * End a contest
 * @param connection Solana connection
 * @param wallet Anchor wallet instance
 * @param contest Contest address
 * @returns Transaction signature
 */
export const endContest = async (
  connection: Connection,
  wallet: anchor.Wallet,
  contest: string,
): Promise<string> => {
  const program = getProgram(connection, wallet);
  const contestPDA = new PublicKey(contest);

  try {
    // Find the prize vault PDA
    const [prizeVaultPDA] = findPrizeVaultPDA(contestPDA);

    // Use camelCase for TypeScript method accounts
    const signature = await program.methods
      .endContest()
      .accounts({
        contest: contestPDA,
        prizeVault: prizeVaultPDA,
        authority: wallet.publicKey,
      })
      .rpc();

    return signature;
  } catch (error) {
    console.error('Error ending contest:', error);
    throw error;
  }
};

/**
 * Claim protocol fee from a contest
 * @param connection Solana connection
 * @param wallet Anchor wallet instance
 * @param contest Contest address
 * @returns Transaction signature
 */
export const claimProtocolFee = async (
  connection: Connection,
  wallet: anchor.Wallet,
  contest: string,
): Promise<string> => {
  const program = getProgram(connection, wallet);
  const contestPDA = new PublicKey(contest);

  try {
    // Find the prize vault PDA
    const [prizeVaultPDA] = findPrizeVaultPDA(contestPDA);

    // Get contest account to find protocol fee destination
    const contestAccount = await program.account.contest.fetch(contestPDA);
    const protocolFeeDestination = contestAccount.protocolFeeDestination;

    // Get fee destination's token account
    const feeDestinationTokenAccounts =
      await connection.getTokenAccountsByOwner(protocolFeeDestination, {
        programId: TOKEN_PROGRAM_ID,
      });

    if (feeDestinationTokenAccounts.value.length === 0) {
      throw new Error('Fee destination has no token accounts');
    }

    // Use camelCase for TypeScript method accounts
    const signature = await program.methods
      .claimProtocolFee()
      .accounts({
        contest: contestPDA,
        prizeVault: prizeVaultPDA,
        protocolFeeDestinationTokenAccount:
          feeDestinationTokenAccounts.value[0].pubkey, // Use the first token account for simplicity
        authority: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return signature;
  } catch (error) {
    console.error('Error claiming protocol fee:', error);
    throw error;
  }
};

/**
 * Claim rewards for a content creator
 * @param connection Solana connection
 * @param wallet Anchor wallet instance
 * @param contest Contest address
 * @param contentIds Array of content IDs to claim rewards for
 * @returns Transaction signature
 */
export const claimAllRewards = async (
  connection: Connection,
  wallet: anchor.Wallet,
  contest: string,
  contentIds: string[],
): Promise<string> => {
  const program = getProgram(connection, wallet);
  const contestPDA = new PublicKey(contest);

  try {
    // Find the prize vault PDA
    const [prizeVaultPDA] = findPrizeVaultPDA(contestPDA);

    // Create the remaining accounts array for the content creators
    const remainingAccounts = [];

    for (const contentId of contentIds) {
      // Find the content PDA
      const [contentPDA] = findContentPDA(contestPDA, parseInt(contentId));

      // Get the content account to find the creator
      const contentAccount = await program.account.content.fetch(contentPDA);
      const creator = contentAccount.creator;

      // Get creator's token accounts
      const creatorTokenAccounts = await connection.getTokenAccountsByOwner(
        creator,
        {
          programId: TOKEN_PROGRAM_ID,
        },
      );

      if (creatorTokenAccounts.value.length === 0) {
        console.warn(
          `Creator ${creator.toString()} has no token accounts, skipping`,
        );
        continue;
      }

      // Add to remaining accounts
      remainingAccounts.push(
        { pubkey: contentPDA, isWritable: false, isSigner: false },
        { pubkey: creator, isWritable: false, isSigner: false },
        {
          pubkey: creatorTokenAccounts.value[0].pubkey,
          isWritable: true,
          isSigner: false,
        }, // Use the first token account for simplicity
      );
    }

    // Use camelCase for TypeScript method accounts
    const signature = await program.methods
      .claimAllRewards()
      .accounts({
        contest: contestPDA,
        prizeVault: prizeVaultPDA,
        authority: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .rpc();

    return signature;
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw error;
  }
};

/**
 * Initialize a new contest
 * @param connection Solana connection
 * @param wallet Anchor wallet instance
 * @param contestLengthSeconds Contest duration in seconds
 * @param winnerShares Array of winner shares in basis points (10000 = 100%)
 * @param protocolFeePercentage Protocol fee percentage in basis points
 * @param prizeMint Address of the prize token mint
 * @param protocolFeeDestination Address to receive protocol fees
 * @param seed Seed value to differentiate contests
 * @returns Contest address and transaction signature
 */
export const initializeContest = async (
  connection: Connection,
  wallet: anchor.Wallet,
  contestLengthSeconds: number,
  winnerShares: number[],
  protocolFeePercentage: number,
  prizeMint: string,
  protocolFeeDestination: string,
  seed: number = 1,
): Promise<{ contestAddress: string; signature: string }> => {
  const program = getProgram(connection, wallet);
  const prizeMintPubkey = new PublicKey(prizeMint);
  const protocolFeeDestinationPubkey = new PublicKey(protocolFeeDestination);

  // Find the contest PDA
  const [contestPDA, contestBump] = findContestPDA(wallet.publicKey, seed);

  // Find the prize vault PDA
  const [prizeVaultPDA, vaultBump] = findPrizeVaultPDA(contestPDA);

  try {
    // Use camelCase for TypeScript method accounts
    const signature = await program.methods
      .initializeContest(
        new BN(contestLengthSeconds),
        winnerShares,
        protocolFeePercentage,
        seed,
      )
      .accounts({
        contest: contestPDA,
        authority: wallet.publicKey,
        prizeMint: prizeMintPubkey,
        prizeVault: prizeVaultPDA,
        protocolFeeDestination: protocolFeeDestinationPubkey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    return {
      contestAddress: contestPDA.toString(),
      signature,
    };
  } catch (error) {
    console.error('Error initializing contest:', error);
    throw error;
  }
};

/**
 * Adds content to multiple contests in batch
 * @param connection Solana connection
 * @param wallet Anchor wallet instance
 * @param contests Array of contest addresses
 * @param creator Creator address
 * @param url Content URL
 * @returns Array of promise results with signatures and content IDs
 */
export const addContentBatch = async ({
  connection,
  wallet,
  contests,
  creator,
  url,
}: {
  connection: Connection;
  wallet: anchor.Wallet;
  contests: string[];
  creator: string;
  url: string;
}): Promise<PromiseSettledResult<AddContentResponse>[]> => {
  const promises: Promise<AddContentResponse>[] = [];

  for (const contest of contests) {
    promises.push(addContent(connection, wallet, contest, creator, url));
  }

  return Promise.allSettled(promises);
};

/**
 * Vote for content in multiple contests in batch
 * @param connection Solana connection
 * @param wallet Anchor wallet instance
 * @param voter Voter address
 * @param entries Array of contest addresses and content IDs
 * @returns Array of promise results with transaction signatures
 */
export const voteContentBatch = async ({
  connection,
  wallet,
  voter,
  entries,
}: {
  connection: Connection;
  wallet: anchor.Wallet;
  voter: string;
  entries: {
    contestAddress: string;
    contentId: string;
  }[];
}): Promise<PromiseSettledResult<string>[]> => {
  const promises: Promise<string>[] = [];

  for (const { contestAddress, contentId } of entries) {
    promises.push(
      voteContent(connection, wallet, contestAddress, voter, contentId),
    );
  }

  return Promise.allSettled(promises);
};

/**
 * Checks if a contest has ended
 * @param connection Solana connection
 * @param contest Contest address
 * @returns Boolean indicating if the contest has ended
 */
export const isContestEnded = async (
  connection: Connection,
  contest: string,
): Promise<boolean> => {
  const program = getProgram(connection);
  const contestPDA = new PublicKey(contest);

  try {
    const contestAccount = await program.account.contest.fetch(contestPDA);

    // Check if the contest has been marked as ended
    if (contestAccount.contestEnded) {
      return true;
    }

    // Check if the end time has passed
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime > contestAccount.endTime.toNumber();
  } catch (error) {
    console.error('Error checking contest status:', error);
    throw error;
  }
};

/**
 * Gets information about a specific content item
 * @param connection Solana connection
 * @param contest Contest address
 * @param contentId Content ID
 * @returns Content information including creator address, URL, and vote count
 */
export const getContentInfo = async (
  connection: Connection,
  contest: string,
  contentId: string,
): Promise<{
  creator: string;
  url: string;
  votes: string;
} | null> => {
  const program = getProgram(connection);
  const contestPDA = new PublicKey(contest);

  try {
    const [contentPDA] = findContentPDA(contestPDA, parseInt(contentId));
    const contentAccount = await program.account.content.fetch(contentPDA);

    return {
      creator: contentAccount.creator.toString(),
      url: contentAccount.url,
      votes: contentAccount.cumulativeVotes.toString(),
    };
  } catch (error) {
    console.error(`Error fetching content info for ID ${contentId}:`, error);
    return null;
  }
};

/**
 * Gets the voting information for a specific voter in a contest
 * @param connection Solana connection
 * @param contest Contest address
 * @param voter Voter address
 * @returns Array of content IDs the voter has voted for
 */
export const getVoterInfo = async (
  connection: Connection,
  contest: string,
  voter: string,
): Promise<string[]> => {
  const program = getProgram(connection);
  const contestPDA = new PublicKey(contest);
  const voterPubkey = new PublicKey(voter);

  try {
    // Get contest account to determine content count
    const contestAccount = await program.account.contest.fetch(contestPDA);
    const contentCount = contestAccount.contentCount.toNumber();

    // Check each content to see if the voter has voted for it
    const votedContentIds: string[] = [];

    for (let i = 0; i < contentCount; i++) {
      const [contentPDA] = findContentPDA(contestPDA, i);
      const [voteRecordPDA] = findVoteRecordPDA(contentPDA, voterPubkey);

      try {
        // Try to fetch the vote record - if it exists, the user has voted for this content
        await program.account.voteRecord.fetch(voteRecordPDA);
        votedContentIds.push(i.toString());
      } catch (error) {
        // Vote record doesn't exist for this content, skip
        continue;
      }
    }

    return votedContentIds;
  } catch (error) {
    console.error('Error fetching voter info:', error);
    return [];
  }
};

/**
 * Gets all content for a contest
 * @param connection Solana connection
 * @param contest Contest address
 * @returns Array of content items with their IDs, creators, URLs, and vote counts
 */
export const getAllContent = async (
  connection: Connection,
  contest: string,
): Promise<
  {
    id: string;
    creator: string;
    url: string;
    votes: string;
  }[]
> => {
  const program = getProgram(connection);
  const contestPDA = new PublicKey(contest);

  try {
    // Get all content accounts for this contest
    const contentAccounts = await program.account.content.all([
      {
        memcmp: {
          offset: 8, // Skip discriminator
          bytes: contestPDA.toBase58(),
        },
      },
    ]);

    return contentAccounts.map((content) => ({
      id: content.account.id.toString(),
      creator: content.account.creator.toString(),
      url: content.account.url,
      votes: content.account.cumulativeVotes.toString(),
    }));
  } catch (error) {
    console.error('Error fetching all content:', error);
    return [];
  }
};

/**
 * Gets a voter's token balance for the contest token
 * @param connection Solana connection
 * @param contest Contest address
 * @param voter Voter address
 * @returns Token balance as a string
 */
export const getVoterTokenBalance = async (
  connection: Connection,
  contest: string,
  voter: string,
): Promise<string> => {
  const program = getProgram(connection);
  const contestPDA = new PublicKey(contest);
  const voterPubkey = new PublicKey(voter);

  try {
    // Get contest account to find the token mint
    const contestAccount = await program.account.contest.fetch(contestPDA);
    const prizeMint = contestAccount.prizeMint;

    // Find the voter's token account for this mint
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      voterPubkey,
      {
        mint: prizeMint,
      },
    );

    if (tokenAccounts.value.length === 0) {
      return '0';
    }

    // Get the balance of the token account
    const tokenAccountInfo = await connection.getTokenAccountBalance(
      tokenAccounts.value[0].pubkey,
    );
    return tokenAccountInfo.value.amount;
  } catch (error) {
    console.error('Error fetching voter token balance:', error);
    return '0';
  }
};
