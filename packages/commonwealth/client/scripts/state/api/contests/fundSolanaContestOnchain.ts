import { WalletId } from '@hicommonwealth/shared';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import WebWalletController from 'controllers/app/web_wallets';
import PhantomWebWalletController from 'controllers/app/webWallets/phantom_web_wallet';
import { depositPrizeWithPhantom } from 'helpers/SolanaContractHelpers/solanaContest';
import { ContractMethods, queryClient } from 'state/api/config';

export interface FundSolanaContestOnchainProps {
  contestAddress: string;
  chainRpc: string;
  amount: number;
  programId?: string; // Optional program ID
}

const fundSolanaContestOnchain = async ({
  contestAddress,
  chainRpc,
  amount,
  programId,
}: FundSolanaContestOnchainProps) => {
  try {
    // Validate inputs
    if (!contestAddress) {
      throw new Error('Contest address is required');
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Get phantom wallet from web wallet controller
    const webWalletController = WebWalletController.Instance;
    const phantomWallet = webWalletController.getByName(
      WalletId.Phantom,
    ) as PhantomWebWalletController;

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

    // Create a connection to the Solana network
    let connectionUrl = chainRpc;
    const { clusterApiUrl } = await import('@solana/web3.js');
    try {
      // If chainRpc is one of the known cluster names like 'devnet', 'mainnet-beta', or 'testnet',
      // use clusterApiUrl to get the actual URL

      if (['devnet', 'mainnet-beta', 'testnet'].includes(chainRpc)) {
        connectionUrl = clusterApiUrl('devnet');
      }
    } catch (err) {
      console.warn(
        `Failed to get cluster API URL for ${chainRpc}, using raw URL instead`,
        err,
      );
    }
    connectionUrl = clusterApiUrl('devnet');
    const connection = new Connection(connectionUrl, 'confirmed');

    // Convert string address to PublicKey
    const contestPda = new PublicKey(contestAddress);

    // Convert programId to PublicKey if provided
    const programPublicKey = programId ? new PublicKey(programId) : undefined;

    // Call the depositPrizeWithPhantom function
    const txSignature = await depositPrizeWithPhantom(
      phantomWallet,
      connection,
      contestPda,
      amount,
      programPublicKey,
    );

    return {
      txSignature,
      contestAddress,
    };
  } catch (error) {
    console.error('Error funding Solana contest:', error);

    if (error.name === 'WalletConnectionError') {
      throw new Error(`Wallet connection error: ${error.message}`);
    } else if (error.name === 'WalletSignTransactionError') {
      throw new Error(`Transaction signing error: ${error.message}`);
    } else if (error.logs) {
      // Solana program logs
      throw new Error(`Solana program error: ${error.message}`);
    }
    throw new Error(`Failed to fund Solana contest: ${error.message}`);
  }
};

const useFundSolanaContestOnchainMutation = () => {
  return useMutation({
    mutationFn: fundSolanaContestOnchain,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [
          ContractMethods.GET_CONTEST_BALANCE,
          variables.contestAddress,
          variables.chainRpc,
        ],
      });
    },
  });
};

export default useFundSolanaContestOnchainMutation;
