import { WalletId, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import WebWalletController from 'controllers/app/web_wallets';
import { initializeContestWithPhantom } from 'helpers/SolanaContractHelpers/solanaContest';

export interface DeploySolanaContestOnchainProps {
  connectionUrl: string;
  prizeMint: string;
  protocolFeeDestination: string;
  contestLengthSeconds: number;
  winnerShares: number[];
  protocolFeePercentage: number;
  seed?: number;
  authority?: string;
}

const deploySolanaContestOnchain = async ({
  connectionUrl,
  prizeMint,
  protocolFeeDestination,
  contestLengthSeconds,
  winnerShares,
  protocolFeePercentage,
  seed,
  authority,
}: DeploySolanaContestOnchainProps) => {
  try {
    // Validate inputs first
    if (!prizeMint) {
      throw new Error('Prize mint address is required');
    }

    if (prizeMint === ZERO_ADDRESS) {
      throw new Error(
        'Prize mint cannot be the zero address. Please provide a valid Solana token address.',
      );
    }

    if (!protocolFeeDestination) {
      throw new Error('Protocol fee destination address is required');
    }

    // Check if winnerShares is valid and sum is approximately 10000 (allow small rounding errors)
    const totalShares = winnerShares.reduce((a, b) => a + b, 0);
    if (Math.abs(totalShares - 10000) > 10) {
      throw new Error(
        `Winner shares must add up to 10000 (100%). Current total: ${totalShares}. Shares: ${JSON.stringify(winnerShares)}`,
      );
    }

    // Create a Solana connection
    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );

    // Get phantom wallet from web wallet controller
    const webWalletController = WebWalletController.Instance;
    const phantomWallet = webWalletController.getByName(WalletId.Phantom);

    if (!phantomWallet) {
      throw new Error(
        'Phantom wallet not found. Please install the Phantom wallet extension.',
      );
    }

    if (!phantomWallet.available) {
      throw new Error(
        'Phantom wallet is not available in this browser. Please install the Phantom extension.',
      );
    }

    if (!phantomWallet.enabled) {
      await phantomWallet.enable();
    }

    if (!phantomWallet.accounts || phantomWallet.accounts.length === 0) {
      throw new Error(
        'No accounts found in Phantom wallet. Please create or import an account.',
      );
    }

    // Ensure prizeMint is a PublicKey
    const prizeMintKey =
      typeof prizeMint === 'string'
        ? new PublicKey(prizeMint)
        : prizeMint instanceof PublicKey
          ? prizeMint
          : null;

    if (!prizeMintKey) {
      throw new Error('Invalid prize mint address format');
    }

    // Ensure protocolFeeDestination is a PublicKey
    const protocolFeeDestinationKey =
      typeof protocolFeeDestination === 'string'
        ? new PublicKey(protocolFeeDestination)
        : protocolFeeDestination instanceof PublicKey
          ? protocolFeeDestination
          : null;

    if (!protocolFeeDestinationKey) {
      throw new Error('Invalid protocol fee destination address format');
    }

    // Final parameters for initialization
    const initParams = {
      prizeMint: prizeMintKey,
      protocolFeeDestination: protocolFeeDestinationKey,
      contestLengthSeconds,
      winnerShares,
      protocolFeePercentage,
    };

    const result = await initializeContestWithPhantom(
      phantomWallet,
      connection,
      initParams,
    );
    return {
      contestPda: result.contestPda.toString(),
      prizeVaultPda: result.prizeVaultPda.toString(),
      txSignature: result.txSignature,
      contestEndDate: result.contestEndDate,
    };
  } catch (error) {
    if (error.name === 'WalletConnectionError') {
      throw new Error(`Wallet connection error: ${error.message}`);
    } else if (error.name === 'WalletSignTransactionError') {
      throw new Error(`Transaction signing error: ${error.message}`);
    } else if (error.logs) {
      // Solana program logs
      throw new Error(`Solana program error: ${error.message}`);
    }
    throw new Error(`Failed to deploy Solana contest: ${error.message}`);
  }
};

const useDeploySolanaContestOnchainMutation = () => {
  return useMutation({
    mutationFn: deploySolanaContestOnchain,
  });
};

export default useDeploySolanaContestOnchainMutation;
