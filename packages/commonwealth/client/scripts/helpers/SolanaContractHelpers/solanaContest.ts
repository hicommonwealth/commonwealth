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
 * Interface for contest initialization parameters
 */
export interface InitializeContestParams {
  connection: Connection;
  wallet: anchor.Wallet;
  programId?: PublicKey;
  authority?: PublicKey; // Optional: defaults to wallet.publicKey
  prizeMint: PublicKey;
  protocolFeeDestination: PublicKey;
  contestLengthSeconds: number;
  winnerShares: number[];
  protocolFeePercentage: number;
  seed?: number; // Optional: will be generated if not provided
}

/**
 * Interface for the result of contest initialization
 */
export interface InitializeContestResult {
  contestPda: PublicKey;
  prizeVaultPda: PublicKey;
  txSignature: string;
  contestEndDate: Date;
}

/**
 * Initializes a Solana contest based on the provided parameters.
 *
 * @param params Parameters required for contest initialization
 * @returns Object containing contest information and transaction signature
 */
export async function initializeContest(
  params: InitializeContestParams,
): Promise<InitializeContestResult> {
  const {
    connection,
    wallet,
    programId,
    prizeMint,
    protocolFeeDestination,
    contestLengthSeconds,
    winnerShares,
    protocolFeePercentage,
  } = params;

  // Set authority to wallet public key if not provided
  const authority = params.authority || wallet.publicKey;

  // Validate winner shares add up to 100% (10000 basis points)
  if (winnerShares.reduce((a, b) => a + b, 0) !== 10000) {
    throw new Error('Winner shares must add up to 10000 (100%)');
  }

  // Validate protocol fee percentage is within range
  if (protocolFeePercentage < 0 || protocolFeePercentage > 10000) {
    throw new Error('Protocol fee percentage must be between 0 and 10000');
  }

  // Create program instance
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  // Use provided programId or default from IDL
  const actualProgramId =
    programId || new PublicKey('Emx5wMhCNPULbwyY5SJpFVr1UFpgyPqugtkNvMUBoh9n');

  // Create the program using the imported IDL
  const program = new Program<SingleContest>(singleContestIdl, provider);

  // Generate a seed if not provided
  const seed = params.seed ?? Math.floor(Date.now() / 1000) % 256; // Ensure seed fits in a u8

  // Derive PDAs for contest and vault
  const [contestPda, _contestBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('contest'),
      authority.toBuffer(),
      Buffer.from([seed]), // Use a single byte array with the seed value
    ],
    program.programId,
  );

  const [prizeVaultPda, _vaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), contestPda.toBuffer()],
    program.programId,
  );

  // Initialize the contest with the program
  const txSignature = await program.methods
    .initializeContest(
      new anchor.BN(contestLengthSeconds),
      winnerShares,
      protocolFeePercentage,
      seed,
    )
    .accounts({
      contest: contestPda,
      authority: authority,
      prizeMint: prizeMint,
      prizeVault: prizeVaultPda,
      protocolFeeDestination: protocolFeeDestination,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return {
    contestPda,
    prizeVaultPda,
    txSignature,
    contestEndDate: new Date(Date.now() + contestLengthSeconds * 1000),
  };
}

// Helper function removed as program initialization is now done directly in each function

/**
 * Utility function to deposit prize funds into a contest
 *
 * @param connection Solana connection
 * @param wallet Anchor wallet
 * @param contestPda Public key of the contest
 * @param amount Amount of tokens to deposit
 * @param programId Optional program ID (uses default if not provided)
 * @returns Transaction signature
 */
export async function depositPrize(
  connection: Connection,
  wallet: anchor.Wallet,
  contestPda: PublicKey,
  amount: number,
  programId?: PublicKey,
): Promise<string> {
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

  // Derive prize vault PDA
  const [prizeVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), contestPda.toBuffer()],
    program.programId,
  );

  // Fetch the contest account to get the prize mint
  const contestAccount = await program.account.contest.fetch(contestPda);
  const prizeMint = contestAccount.prizeMint;

  // Derive the depositor's associated token account
  const depositorTokenAccount = getAssociatedTokenAddressSync(
    prizeMint,
    wallet.publicKey,
  );

  // Deposit prize tokens
  const txSignature = await program.methods
    .depositPrize(new anchor.BN(amount))
    .accounts({
      contest: contestPda,
      prizeVault: prizeVaultPda,
      depositor: wallet.publicKey,
      depositorTokenAccount: depositorTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return txSignature;
}

/**
 * Helper function to initialize a contest using a PhantomWebWalletController
 *
 * @param phantomWallet An instance of PhantomWebWalletController
 * @param connection Solana connection
 * @param params Other contest parameters
 * @returns Contest initialization result
 */
export async function initializeContestWithPhantom(
  phantomWallet: any, // Using any to avoid importing the specific controller type
  connection: Connection,
  params: Omit<InitializeContestParams, 'connection' | 'wallet'>,
): Promise<InitializeContestResult> {
  // Create the anchor provider using our phantom wallet
  const provider = phantomWallet.createAnchorProvider(connection);

  // Call the initialize contest function with all required parameters
  return initializeContest({
    connection,
    wallet: provider.wallet,
    ...params,
  });
}

/**
 * Helper function to deposit prize funds using a PhantomWebWalletController
 *
 * @param phantomWallet An instance of PhantomWebWalletController
 * @param connection Solana connection
 * @param contestPda Public key of the contest
 * @param amount Amount of tokens to deposit
 * @param programId Optional program ID (uses default if not provided)
 * @returns Transaction signature
 */
export async function depositPrizeWithPhantom(
  phantomWallet: any, // Using any to avoid importing the specific controller type
  connection: Connection,
  contestPda: PublicKey,
  amount: number,
  programId?: PublicKey,
): Promise<string> {
  // Create the anchor provider using our phantom wallet
  const provider = phantomWallet.createAnchorProvider(connection);

  // Call the deposit prize function with all required parameters
  return depositPrize(
    connection,
    provider.wallet,
    contestPda,
    amount,
    programId,
  );
}

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
 * Helper function to add content to a contest using a PhantomWebWalletController
 *
 * @param phantomWallet An instance of PhantomWebWalletController
 * @param connection Solana connection
 * @param contestPda Public key of the contest
 * @param contentUrl URL or content string to add
 * @param creator Optional creator public key (defaults to wallet.publicKey)
 * @param programId Optional program ID (uses default if not provided)
 * @returns Object containing content information and transaction signature
 */
export async function addContentWithPhantom(
  phantomWallet: any, // Using any to avoid importing the specific controller type
  connection: Connection,
  contestPda: PublicKey,
  contentUrl: string,
  creator?: PublicKey,
  programId?: PublicKey,
): Promise<AddContentResult> {
  // Create the anchor provider using our phantom wallet
  const provider = phantomWallet.createAnchorProvider(connection);

  // Call the add content function with all required parameters
  return addContentToContest(
    connection,
    provider.wallet,
    contestPda,
    contentUrl,
    creator || provider.wallet.publicKey,
    programId,
  );
}

/**
 * Helper function to vote for content using a PhantomWebWalletController
 *
 * @param phantomWallet An instance of PhantomWebWalletController
 * @param connection Solana connection
 * @param contestPda Public key of the contest
 * @param contentId ID of the content to vote for
 * @param amount Optional voting amount (defaults to 1)
 * @param programId Optional program ID (uses default if not provided)
 * @returns Object containing vote information and transaction signature
 */
export async function voteForContentWithPhantom(
  phantomWallet: any, // Using any to avoid importing the specific controller type
  connection: Connection,
  contestPda: PublicKey,
  contentId: number,
  amount: number = 1,
  programId?: PublicKey,
): Promise<VoteContentResult> {
  // Create the anchor provider using our phantom wallet
  const provider = phantomWallet.createAnchorProvider(connection);

  // Call the vote for content function with all required parameters
  return voteForContent(
    connection,
    provider.wallet,
    contestPda,
    contentId,
    amount,
    programId,
  );
}
