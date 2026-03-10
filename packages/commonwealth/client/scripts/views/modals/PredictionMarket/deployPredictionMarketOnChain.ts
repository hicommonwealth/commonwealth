/**
 * Builds and sends the on-chain prediction market deployment transaction
 * (FutarchyGovernor.propose), then returns the deploy payload for
 * deployPredictionMarket mutation.
 */

import MagicWebWalletController from 'client/scripts/controllers/app/webWallets/MagicWebWallet';
import PredictionMarket, {
  type DeployPredictionMarketPayload,
} from 'client/scripts/helpers/ContractHelpers/predictionMarket';
import { fetchNodes } from 'state/api/nodes';
import { userStore } from 'state/ui/user';

export type { DeployPredictionMarketPayload };

export type DeployPredictionMarketOnChainParams = {
  eth_chain_id: number;
  chain_rpc: string;
  user_address: string;
  prompt: string;
  collateral_address: `0x${string}`;
  duration_days: number;
  resolution_threshold: number;
  initial_liquidity: string;
};

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

function assertValidEthereumAddress(
  value: unknown,
  fieldName: string,
): asserts value is `0x${string}` {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(
      `Invalid parameters: must provide an Ethereum address for ${fieldName}`,
    );
  }
  const trimmed = value.trim();
  if (!EVM_ADDRESS_REGEX.test(trimmed)) {
    throw new Error(
      `Invalid parameters: ${fieldName} must be a valid Ethereum address (0x + 40 hex chars)`,
    );
  }
}

/**
 * Executes the on-chain deployment flow using PredictionMarket helper.
 *
 * @throws Error when chain not configured, wallet not connected, or addresses invalid
 */
export async function deployPredictionMarketOnChain(
  params: DeployPredictionMarketOnChainParams,
): Promise<DeployPredictionMarketPayload> {
  assertValidEthereumAddress(params.user_address, 'user_address (wallet)');
  assertValidEthereumAddress(params.collateral_address, 'collateral_address');

  const governorAddress = PredictionMarket.getGovernorAddress(
    params.eth_chain_id,
  );
  if (!governorAddress) {
    throw new Error('On-chain deployment is not configured for this chain.');
  }

  const userAddresses = userStore.getState().addresses;
  const isMagicAddress = userAddresses.some(
    (addr) =>
      addr.address.toLowerCase() === params.user_address.toLowerCase() &&
      addr.walletId?.toLowerCase().includes('magic'),
  );

  // Use wallet provider for signing (required for eth_sendTransaction).
  // RPC URLs don't support signing; only Magic needs explicit provider.
  let provider: string | unknown = undefined;
  if (isMagicAddress) {
    await fetchNodes();
    const controller = new MagicWebWalletController();
    await controller.enable(String(params.eth_chain_id));
    provider = (controller as { provider?: unknown }).provider;
  }

  const pm = new PredictionMarket(governorAddress, params.chain_rpc);
  await pm.initialize(true, String(params.eth_chain_id), provider);

  return pm.deploy({
    user_address: params.user_address,
    collateral_address: params.collateral_address,
    duration_days: params.duration_days,
    resolution_threshold: params.resolution_threshold,
    initial_liquidity: params.initial_liquidity,
  });
}
