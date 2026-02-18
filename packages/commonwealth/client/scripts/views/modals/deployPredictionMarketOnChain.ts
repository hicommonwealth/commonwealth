/**
 * Builds and sends the on-chain prediction market deployment transaction
 * (FutarchyGovernor.propose), then returns the deploy payload for
 * deployPredictionMarket mutation.
 */

import {
  BinaryVaultAbi,
  FutarchyGovernorAbi,
} from '@commonxyz/common-protocol-abis';
import MagicWebWalletController from 'controllers/app/webWallets/MagicWebWallet';
import { fetchNodes } from 'state/api/nodes';
import { userStore } from 'state/ui/user';
import { decodeEventLog, type Address } from 'viem';
import Web3 from 'web3';
import type { AbiItem } from 'web3-utils';
import { getFutarchyGovernorAddress } from './futarchyConfig';

export type DeployPredictionMarketPayload = {
  vault_address: `0x${string}`;
  governor_address: `0x${string}`;
  router_address: `0x${string}`;
  strategy_address: `0x${string}`;
  p_token_address: `0x${string}`;
  f_token_address: `0x${string}`;
  start_time: Date;
  end_time: Date;
};

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

function randomBytes32(): `0x${string}` {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
}

function parseInitialLiquidityWei(value: string): bigint {
  if (!value || value.trim() === '') return 0n;
  const trimmed = value.trim();
  const dot = trimmed.indexOf('.');
  const whole = dot === -1 ? trimmed : trimmed.slice(0, dot);
  const frac = dot === -1 ? '' : trimmed.slice(dot + 1).slice(0, 18);
  const combined = whole + frac.padEnd(18, '0').slice(0, 18);
  return BigInt(combined || '0');
}

/**
 * Executes the on-chain deployment flow: connect wallet, build propose tx,
 * sign and send, wait for receipt, decode ProposalCreated/MarketCreated
 * events, then read governor.router() for router_address; return payload for deployPredictionMarket.
 *
 * @throws Error when wallet is not connected or chain not configured
 */
export async function deployPredictionMarketOnChain(
  params: DeployPredictionMarketOnChainParams,
): Promise<DeployPredictionMarketPayload> {
  const governorAddress = getFutarchyGovernorAddress(params.eth_chain_id);
  if (!governorAddress) {
    throw new Error(
      'On-chain deployment is not yet configured for this chain. ' +
        'Set VITE_FUTARCHY_GOVERNOR_ADDRESSES (e.g. {"84532":"0x..."}). ' +
        'Your draft has been created.',
    );
  }

  const userAddresses = userStore.getState().addresses;
  const isMagicAddress = userAddresses.some(
    (addr) =>
      addr.address.toLowerCase() === params.user_address.toLowerCase() &&
      addr.walletId?.toLowerCase().includes('magic'),
  );

  let provider: string | unknown = params.chain_rpc;
  if (isMagicAddress) {
    await fetchNodes();
    const controller = new MagicWebWalletController();
    await controller.enable(String(params.eth_chain_id));
    provider = (controller as { provider?: unknown }).provider;
  }

  const web3 = new Web3(provider as string);
  const contract = new web3.eth.Contract(
    FutarchyGovernorAbi as unknown as AbiItem[],
    governorAddress,
  );

  const proposalId = randomBytes32();
  const marketId = randomBytes32();
  const durationSeconds = BigInt(params.duration_days * 86400);
  const resolutionThresholdBps = BigInt(
    Math.round(params.resolution_threshold * 10000),
  );
  const initialLiquidityWei = parseInitialLiquidityWei(
    params.initial_liquidity,
  );

  const tx = contract.methods.propose(
    proposalId,
    marketId,
    params.collateral_address,
    durationSeconds,
    resolutionThresholdBps,
    initialLiquidityWei,
  );

  type LogLike = { address?: string; data?: string; topics?: string[] };
  const rawReceipt = await (async () => {
    try {
      const gas = await tx.estimateGas({ from: params.user_address });
      return await tx.send({
        from: params.user_address,
        gas: String(BigInt(gas.toString()) + 100000n),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/user rejected|denied|reject/i.test(msg)) {
        throw new Error('Transaction was rejected by the user.');
      }
      if (/insufficient funds|not enough balance/i.test(msg)) {
        throw new Error('Insufficient funds for gas.');
      }
      throw err;
    }
  })();

  const logs: Array<{ address: string; data: string; topics: string[] }> = (
    rawReceipt.logs ?? []
  ).map((log: LogLike) => ({
    address: log.address ?? '',
    data: log.data ?? '0x',
    topics: Array.isArray(log.topics) ? log.topics : [],
  }));

  let strategy_address: `0x${string}` =
    '0x0000000000000000000000000000000000000000' as `0x${string}`;
  let startTime = 0n;
  let endTime = 0n;
  let vault_address: `0x${string}` =
    '0x0000000000000000000000000000000000000000' as `0x${string}`;
  let p_token_address: `0x${string}` =
    '0x0000000000000000000000000000000000000000' as `0x${string}`;
  let f_token_address: `0x${string}` =
    '0x0000000000000000000000000000000000000000' as `0x${string}`;

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: FutarchyGovernorAbi,
        data: log.data as `0x${string}`,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        strict: false,
      });
      if (decoded.eventName === 'ProposalCreated') {
        strategy_address = (decoded.args as { strategy: Address }).strategy;
        startTime = (decoded.args as { startTime: bigint }).startTime;
        endTime = (decoded.args as { endTime: bigint }).endTime;
        break;
      }
    } catch {
      // not ProposalCreated, try next
    }
  }

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: BinaryVaultAbi,
        data: log.data as `0x${string}`,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        strict: false,
      });
      if (decoded.eventName === 'MarketCreated') {
        vault_address = log.address as `0x${string}`;
        p_token_address = (decoded.args as { pToken: Address }).pToken;
        f_token_address = (decoded.args as { fToken: Address }).fToken;
        break;
      }
    } catch {
      // not MarketCreated
    }
  }

  const routerContract = new web3.eth.Contract(
    FutarchyGovernorAbi as unknown as AbiItem[],
    governorAddress,
  );
  let router_address: `0x${string}` =
    '0x0000000000000000000000000000000000000000' as `0x${string}`;
  try {
    const r = (await routerContract.methods.router().call()) as unknown;
    if (typeof r === 'string' && r.startsWith('0x')) {
      router_address = r as `0x${string}`;
    }
  } catch {
    // leave zero if not available
  }

  return {
    governor_address: governorAddress as `0x${string}`,
    vault_address,
    router_address,
    strategy_address,
    p_token_address,
    f_token_address,
    start_time: new Date(Number(startTime) * 1000),
    end_time: new Date(Number(endTime) * 1000),
  };
}
