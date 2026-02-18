/**
 * Prediction market (Futarchy) governor contract helper.
 * Address from chainConfig only (libs/evm-protocols factoryContracts).
 * We wrap propose() and router(); the contract may expose more (e.g. resolve, cancel).
 */
import {
  BinaryVaultAbi,
  FutarchyGovernorAbi,
} from '@commonxyz/common-protocol-abis';
import { factoryContracts } from '@hicommonwealth/evm-protocols';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { decodeEventLog, type Address } from 'viem';
import type { AbiItem } from 'web3-utils';
import ContractBase from './ContractBase';

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

export type DeployParams = {
  user_address: string;
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

class PredictionMarket extends ContractBase {
  constructor(governorAddress: string, rpc: string) {
    super(governorAddress, FutarchyGovernorAbi as unknown as AbiItem[], rpc);
  }

  /** Governor address for the given chain from chainConfig, or null if not set / zero. */
  static getGovernorAddress(ethChainId: number): string | null {
    const entry = Object.values(factoryContracts).find(
      (c) => c.chainId === ethChainId,
    );
    if (!entry) return null;
    const addr = (entry as Partial<Record<'FutarchyGovernor', string>>)
      .FutarchyGovernor;
    if (
      !addr ||
      typeof addr !== 'string' ||
      !addr.startsWith('0x') ||
      addr === ZERO_ADDRESS
    )
      return null;
    return addr;
  }

  static isDeployConfigured(ethChainId: number): boolean {
    return PredictionMarket.getGovernorAddress(ethChainId) != null;
  }

  /** Read router address from the governor contract. */
  async getRouter(): Promise<`0x${string}`> {
    this.isInitialized();
    const r = (await this.contract.methods.router().call()) as unknown;
    if (typeof r === 'string' && r.startsWith('0x')) {
      return r as `0x${string}`;
    }
    return '0x0000000000000000000000000000000000000000' as `0x${string}`;
  }

  /**
   * Send propose tx. Returns the transaction receipt.
   */
  async propose(
    proposalId: `0x${string}`,
    marketId: `0x${string}`,
    collateralAddress: `0x${string}`,
    durationSeconds: bigint,
    resolutionThresholdBps: bigint,
    initialLiquidityWei: bigint,
    fromAddress: string,
  ): Promise<{
    logs?: Array<{ address?: string; data?: string; topics?: string[] }>;
  }> {
    this.isInitialized();
    const tx = this.contract.methods.propose(
      proposalId,
      marketId,
      collateralAddress,
      durationSeconds,
      resolutionThresholdBps,
      initialLiquidityWei,
    );
    try {
      const gas = await tx.estimateGas({ from: fromAddress });
      return await tx.send({
        from: fromAddress,
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
  }

  /**
   * Propose a new market, decode events, and return the payload for deployPredictionMarket mutation.
   */
  async deploy(params: DeployParams): Promise<DeployPredictionMarketPayload> {
    this.isInitialized();
    const proposalId = randomBytes32();
    const marketId = randomBytes32();
    const durationSeconds = BigInt(params.duration_days * 86400);
    const resolutionThresholdBps = BigInt(
      Math.round(params.resolution_threshold * 10000),
    );
    const initialLiquidityWei = parseInitialLiquidityWei(
      params.initial_liquidity,
    );

    const rawReceipt = await this.propose(
      proposalId,
      marketId,
      params.collateral_address,
      durationSeconds,
      resolutionThresholdBps,
      initialLiquidityWei,
      params.user_address,
    );

    const logs: Array<{ address: string; data: string; topics: string[] }> = (
      rawReceipt.logs ?? []
    ).map((log: { address?: string; data?: string; topics?: string[] }) => ({
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
        // not ProposalCreated
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

    const router_address = await this.getRouter();

    return {
      governor_address: this.contractAddress as `0x${string}`,
      vault_address,
      router_address,
      strategy_address,
      p_token_address,
      f_token_address,
      start_time: new Date(Number(startTime) * 1000),
      end_time: new Date(Number(endTime) * 1000),
    };
  }
}

export default PredictionMarket;
