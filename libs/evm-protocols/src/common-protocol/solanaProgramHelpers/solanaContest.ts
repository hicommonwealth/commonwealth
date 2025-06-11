import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { singleContestIdl } from './idl/single_contest_idl';
import { SingleContest } from './types/single_contest';

/**
 * Interface for the result of adding content to a contest
 */
export interface AddContentResult {
  contentPda: PublicKey;
  contentId: number;
  txSignature: string;
}

/**
 * Interface for the result of voting for content
 */
export interface VoteContentResult {
  contentPda: PublicKey;
  voteRecordPda: PublicKey;
  txSignature: string;
}

/**
 * Adds content to a Solana contest
 *
 * @param connection Solana connection
 * @param wallet Anchor wallet
 * @param contestPda Public key of the contest
 * @param contentUrl URL or content string to add
 * @param creator Optional creator public key (defaults to wallet.publicKey)
 * @param programId Optional program ID (uses default if not provided)
 * @returns Object containing content information and transaction signature
 */
export async function addContentToContest(
  connection: Connection,
  wallet: anchor.Wallet,
  contestPda: PublicKey,
  contentUrl: string,
  creator?: PublicKey,
  programId?: PublicKey,
): Promise<AddContentResult> {
  // Create program instance
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  // Use provided programId or default from IDL
  const actualProgramId =
    programId || new PublicKey('Emx5wMhCNPULbwyY5SJpFVr1UFpgyPqugtkNvMUBoh9n');

  // Create the program using the imported IDL
  const program = new anchor.Program(
    singleContestIdl,
    provider,
  ) as Program<SingleContest>;

  // Set creator to wallet public key if not provided
  const creatorKey = creator || wallet.publicKey;

  // Fetch contest account to get the current content count
  const contestAccount = await program.account.contest.fetch(contestPda);

  // Log the contest account for debugging (will be removed after debugging)
  console.log('Contest account data:', JSON.stringify(contestAccount, null, 2));

  // Check if the required properties exist and use them with proper casing
  // Use optional chaining to prevent errors if properties don't exist
  const contentCount = contestAccount.contentCount;

  // Check if contest has ended
  if (contestAccount.contestEnded) {
    throw new Error('Contest has already ended');
  }

  // Check if contest is still accepting submissions
  const now = Math.floor(Date.now() / 1000);
  if (contestAccount.endTime && now >= contestAccount.endTime.toNumber()) {
    throw new Error(
      `Contest submission period has ended. End time: ${new Date(contestAccount.endTime.toNumber() * 1000).toLocaleString()}`,
    );
  }

  // Calculate content PDA
  const [contentPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('content'),
      contestPda.toBuffer(),
      contentCount.toArrayLike(Buffer, 'le', 8),
    ],
    program.programId,
  );

  // Add content to the contest
  const txSignature = await program.methods
    .addContent(contentUrl)
    .accounts({
      contest: contestPda,
      content: contentPda,
      authority: wallet.publicKey,
      creator: creatorKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return {
    contentPda,
    contentId: contentCount?.toNumber() || 0,
    txSignature,
  };
}

/**
 * Votes for content in a Solana contest
 *
 * @param connection Solana connection
 * @param wallet Anchor wallet
 * @param contestPda Public key of the contest
 * @param contentId ID of the content to vote for
 * @param amount Optional voting amount (defaults to 1)
 * @param programId Optional program ID (uses default if not provided)
 * @returns Object containing vote information and transaction signature
 */
export async function voteForContent(
  connection: Connection,
  wallet: anchor.Wallet,
  contestPda: PublicKey,
  contentId: number,
  amount: number = 1,
  programId?: PublicKey,
): Promise<VoteContentResult> {
  // Create program instance
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  // Use provided programId or default from IDL
  const actualProgramId =
    programId || new PublicKey('Emx5wMhCNPULbwyY5SJpFVr1UFpgyPqugtkNvMUBoh9n');

  // Create the program using the imported IDL
  const program = new anchor.Program(
    singleContestIdl,
    provider,
  ) as Program<SingleContest>;

  // Fetch contest account to validate and get prizeMint
  const contestAccount = await program.account.contest.fetch(contestPda);

  // Check if contest has ended
  if (contestAccount.contestEnded) {
    throw new Error('Contest has already ended');
  }

  // Check if content exists
  if (contentId >= (contestAccount.contentCount?.toNumber() || 0)) {
    throw new Error(
      `Content ID ${contentId} does not exist. Contest has ${contestAccount.contentCount?.toString() || '0'} content items.`,
    );
  }

  // Calculate content PDA
  const [contentPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('content'),
      contestPda.toBuffer(),
      new anchor.BN(contentId).toArrayLike(Buffer, 'le', 8),
    ],
    program.programId,
  );

  // Calculate vote record PDA
  const [voteRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vote'), contentPda.toBuffer(), wallet.publicKey.toBuffer()],
    program.programId,
  );

  // Get user's token account
  const userTokenAccount = getAssociatedTokenAddressSync(
    contestAccount.prizeMint,
    wallet.publicKey,
  );

  // Vote for the content
  const txSignature = await program.methods
    .voteContent()
    .accounts({
      contest: contestPda,
      content: contentPda,
      voteRecord: voteRecordPda,
      voter: wallet.publicKey,
      voterTokenAccount: userTokenAccount,
      prizeVault: contestAccount.prizeVault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return {
    contentPda,
    voteRecordPda,
    txSignature,
  };
}

/**
 * Interface for the result of getting prize vault balance
 */
export interface PrizeVaultBalanceResult {
  balance: number;
  prizeMint: PublicKey;
  prizeVaultPda: PublicKey;
}

/**
 * Gets the balance of a contest's prize vault
 *
 * @param connection Solana connection
 * @param contestPda Public key of the contest
 * @param programId Optional program ID (uses default if not provided)
 * @returns Object containing balance information
 */
export async function getPrizeVaultBalance(
  connection: Connection,
  contestPda: PublicKey,
  programId?: PublicKey,
): Promise<PrizeVaultBalanceResult> {
  // Use provided programId or default
  const actualProgramId =
    programId || new PublicKey('Emx5wMhCNPULbwyY5SJpFVr1UFpgyPqugtkNvMUBoh9n');

  // Create a program instance using a temporary provider
  // Since we're only reading data, we don't need a real wallet
  const provider = new anchor.AnchorProvider(
    connection,
    // Create a read-only wallet
    {
      publicKey: PublicKey.default,
      signTransaction: async () => {
        throw new Error('Wallet is read-only');
      },
      signAllTransactions: async () => {
        throw new Error('Wallet is read-only');
      },
    },
    { commitment: 'confirmed' },
  );

  // Create the program using the imported IDL
  const program = new anchor.Program(
    singleContestIdl,
    provider,
  ) as Program<SingleContest>;

  // Fetch the contest account to get the prize vault PDA and mint
  const contestAccount = await program.account.contest.fetch(contestPda);
  const prizeMint = contestAccount.prizeMint;
  const prizeVaultPda = contestAccount.prizeVault;

  // Get the token account info for the prize vault
  const tokenAccountInfo =
    await connection.getTokenAccountBalance(prizeVaultPda);

  // Return the balance and related information
  return {
    balance: Number(tokenAccountInfo.value.amount),
    prizeMint,
    prizeVaultPda,
  };
}

/**
 * Interface for contest status information
 */
export interface ContestStatus {
  startTime: number;
  endTime: number;
  contestInterval: number;
  lastContentId: string;
  prizeShare: number;
  contestToken: `0x${string}`;
}

/**
 * Gets relevant contest state information, similar to EVM's getContestStatus but without voterShare
 *
 * @param connection Solana connection
 * @param contestPda Public key of the contest
 * @param programId Optional program ID (uses default if not provided)
 * @returns ContestStatus object
 */
export async function getContestStatus(
  connection: Connection,
  contestPda: PublicKey,
  programId?: PublicKey,
): Promise<ContestStatus> {
  // Use provided programId or default
  const actualProgramId =
    programId || new PublicKey('Emx5wMhCNPULbwyY5SJpFVr1UFpgyPqugtkNvMUBoh9n');

  // Create a program instance using a temporary provider
  // Since we're only reading data, we don't need a real wallet
  const provider = new anchor.AnchorProvider(
    connection,
    // Create a read-only wallet
    {
      publicKey: PublicKey.default,
      signTransaction: async () => {
        throw new Error('Wallet is read-only');
      },
      signAllTransactions: async () => {
        throw new Error('Wallet is read-only');
      },
    },
    { commitment: 'confirmed' },
  );

  // Create the program using the imported IDL
  const program = new anchor.Program(
    singleContestIdl,
    provider,
  ) as Program<SingleContest>;

  // Fetch the contest account
  const contestAccount = await program.account.contest.fetch(contestPda);

  // Extract relevant contest data
  const startTime = contestAccount.startTime.toNumber();
  const endTime = contestAccount.endTime.toNumber();
  const contestInterval = endTime - startTime; // Calculate interval from start and end time
  const lastContentId = contestAccount.contentCount.toString();
  const prizeShare = contestAccount.prizeShare || 100; // Default to 100% if not specified

  // Convert prizeMint to hex string format to match EVM interface
  const contestToken = `0x${new PublicKey(contestAccount.prizeMint).toString()}`;

  return {
    startTime,
    endTime,
    contestInterval,
    lastContentId,
    prizeShare,
    contestToken,
  };
}

/**
 * Interface for winner information
 */
export interface WinnerInfo {
  contentId: number;
  creator: string;
  contentUrl: string;
  votes: number;
  prizeAmount: number;
  isPrizeClaimed: boolean;
}

/**
 * Interface for contest score information
 */
export interface ContestScore {
  totalPrize: number;
  protocolFee: number;
  isContestEnded: boolean;
  winners: WinnerInfo[];
}

/**
 * Gets the contest score, including winners and prize distribution information
 *
 * @param connection Solana connection
 * @param contestPda Public key of the contest
 * @param programId Optional program ID (uses default if not provided)
 * @returns ContestScore object
 */
export async function getContestScore(
  connection: Connection,
  contestPda: PublicKey,
  programId?: PublicKey,
): Promise<ContestScore> {
  // Use provided programId or default
  const actualProgramId =
    programId || new PublicKey('Emx5wMhCNPULbwyY5SJpFVr1UFpgyPqugtkNvMUBoh9n');

  // Create a program instance using a temporary provider
  // Since we're only reading data, we don't need a real wallet
  const provider = new anchor.AnchorProvider(
    connection,
    // Create a read-only wallet
    {
      publicKey: PublicKey.default,
      signTransaction: async () => {
        throw new Error('Wallet is read-only');
      },
      signAllTransactions: async () => {
        throw new Error('Wallet is read-only');
      },
    },
    { commitment: 'confirmed' },
  );

  // Create the program using the imported IDL
  const program = new anchor.Program(
    singleContestIdl,
    provider,
  ) as Program<SingleContest>;

  // Fetch the contest account
  const contestAccount = await program.account.contest.fetch(contestPda);

  // Get the prize vault PDA from the contest account
  const prizeVaultPda = contestAccount.prizeVault;

  // Get the token account info for the prize vault to determine the actual balance
  const tokenAccountInfo =
    await connection.getTokenAccountBalance(prizeVaultPda);
  const vaultBalance = Number(tokenAccountInfo.value.amount);

  // Initialize the result object
  const result: ContestScore = {
    totalPrize: vaultBalance,
    protocolFee: contestAccount.protocolFee.toNumber(),
    isContestEnded: contestAccount.contestEnded,
    winners: [],
  };
  console.log('totalPrize (from vault):', vaultBalance);

  // Check if there are any winner IDs (regardless of contest status)
  if (contestAccount.winnerIds && contestAccount.winnerIds.length > 0) {
    // Calculate the prize distribution based on winner shares
    const winnerShares = contestAccount.winnerShares;
    const claimedMask = contestAccount.claimedMask.toNumber();

    // Calculate the prize pool (after protocol fee is taken out)
    const prizePool = result.totalPrize - result.protocolFee;
    console.log('Prize pool:', prizePool);
    console.log('winnerIDs', contestAccount.winnerIds[0].toNumber());
    // Fetch content info for each winner
    const winnerPromises = contestAccount.winnerIds.map(
      async (contentId, index) => {
        // Calculate content PDA
        const [contentPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('content'),
            contestPda.toBuffer(),
            contentId.toArrayLike(Buffer, 'le', 8),
          ],
          program.programId,
        );

        // Fetch content account
        const contentAccount = await program.account.content.fetch(contentPda);

        // Calculate prize amount based on winner share
        const sharePercentage = winnerShares[index] / 10000; // Convert basis points to decimal
        const prizeAmount = Math.floor(prizePool * sharePercentage);

        // Check if prize has been claimed (using bitmask)
        const isPrizeClaimed = Boolean((claimedMask >> index) & 1);

        return {
          contentId: contentId.toNumber(),
          creator: contentAccount.creator.toString(),
          contentUrl: contentAccount.url,
          votes: contentAccount.cumulativeVotes.toNumber(),
          prizeAmount,
          isPrizeClaimed,
        };
      },
    );

    // Wait for all winner info to be collected
    result.winners = await Promise.all(winnerPromises);
  }

  return result;
}
