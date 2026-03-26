/**
 * Executes the on-chain resolution transaction (FutarchyGovernor.resolve)
 * and returns the winner from the ProposalResolved event.
 */

import MagicWebWalletController from 'client/scripts/controllers/app/webWallets/MagicWebWallet';
import PredictionMarket from 'client/scripts/helpers/ContractHelpers/predictionMarket';
import { fetchNodes } from 'state/api/nodes';
import { userStore } from 'state/ui/user';

export type ResolvePredictionMarketOnChainParams = {
  eth_chain_id: number;
  chain_rpc: string;
  user_address: string;
  governor_address: string;
  proposal_id: `0x${string}`;
  twap_window_seconds: number;
};

/**
 * Executes the on-chain resolve flow. Returns the winner (1=PASS, 2=FAIL).
 *
 * @throws Error when chain not configured, wallet not connected, or tx fails
 */
export async function resolvePredictionMarketOnChain(
  params: ResolvePredictionMarketOnChainParams,
): Promise<{ winner: number }> {
  if (!PredictionMarket.isDeployConfigured(params.eth_chain_id)) {
    throw new Error('On-chain resolution is not configured for this chain.');
  }

  const userAddresses = userStore.getState().addresses;
  const isMagicAddress = userAddresses.some(
    (addr) =>
      addr.address.toLowerCase() === params.user_address.toLowerCase() &&
      addr.walletId?.toLowerCase().includes('magic'),
  );

  let provider: string | unknown = undefined;
  if (isMagicAddress) {
    await fetchNodes();
    const controller = new MagicWebWalletController();
    await controller.enable(String(params.eth_chain_id));
    provider = (controller as { provider?: unknown }).provider;
  }

  const pm = new PredictionMarket(params.governor_address, params.chain_rpc);
  await pm.initialize(true, String(params.eth_chain_id), provider);

  return pm.resolve(
    params.proposal_id,
    params.twap_window_seconds,
    params.user_address,
  );
}
