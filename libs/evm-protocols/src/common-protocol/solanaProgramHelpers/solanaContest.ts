import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { SingleContest } from './idl/single_contest';
import { singleContestIdl } from './idl2/single_contest_idl';

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
