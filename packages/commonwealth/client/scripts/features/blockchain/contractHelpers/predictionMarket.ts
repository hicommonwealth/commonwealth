/**
 * Prediction market (Futarchy) governor contract helper.
 * Address from chainConfig only (libs/evm-protocols factoryContracts).
 * We wrap propose() and router(); the contract may expose more (e.g. resolve, cancel).
 */
import {
  BinaryVaultAbi,
  FutarchyGovernorAbi,
} from '@commonxyz/common-protocol-abis';
import { erc20Abi, factoryContracts } from '@hicommonwealth/evm-protocols';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { decodeErrorResult, decodeEventLog, type Address } from 'viem';
import type { AbiItem } from 'web3-utils';
import ContractBase from './ContractBase';

export type DeployPredictionMarketPayload = {
  market_id: `0x${string}`;
  vault_address: `0x${string}`;
  governor_address: `0x${string}`;
  router_address: `0x${string}`;
  strategy_address: `0x${string}`;
  p_token_address: `0x${string}`;
  f_token_address: `0x${string}`;
  proposal_id: `0x${string}`;
  start_time: Date;
  end_time: Date;
};

export type DeployParams = {
  user_address: string;
  collateral_address: `0x${string}`;
  duration_days: number;
  resolution_threshold: number;
  initial_liquidity: string;
  initial_liquidity_wei?: string | bigint;
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

/** Parse human-readable token amount to smallest units (e.g. "10", 6 decimals → 10_000_000n). */
function parseTokenAmount(value: string, decimals: number): bigint {
  if (!value || value.trim() === '') return 0n;
  const trimmed = value.trim();
  const dot = trimmed.indexOf('.');
  const whole = dot === -1 ? trimmed : trimmed.slice(0, dot);
  const frac = dot === -1 ? '' : trimmed.slice(dot + 1).slice(0, decimals);
  const combined = whole + frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(combined || '0');
}

function extractHexRevertData(input: unknown): `0x${string}` | null {
  if (typeof input === 'string' && /^0x[0-9a-fA-F]+$/.test(input)) {
    return input as `0x${string}`;
  }
  if (!input || typeof input !== 'object') return null;
  const candidate = input as {
    data?: unknown;
    cause?: unknown;
    error?: unknown;
    originalError?: unknown;
  };
  return (
    extractHexRevertData(candidate.data) ??
    extractHexRevertData(candidate.cause) ??
    extractHexRevertData(candidate.error) ??
    extractHexRevertData(candidate.originalError)
  );
}

function formatRevertReason(err: unknown): string | null {
  const revertData = extractHexRevertData(err);
  if (!revertData || revertData === '0x') return null;
  try {
    const decoded = decodeErrorResult({
      abi: FutarchyGovernorAbi,
      data: revertData,
    });
    const args =
      Array.isArray(decoded.args) && decoded.args.length > 0
        ? ` (${decoded.args.map((a) => String(a)).join(', ')})`
        : '';
    return `Transaction reverted: ${decoded.errorName}${args}.`;
  } catch {
    const selector = revertData.slice(0, 10);
    return (
      `Transaction reverted (error selector ${selector}). ` +
      'Check collateral support, initial liquidity (> 0), duration, and threshold settings.'
    );
  }
}

function normalizeAddress(
  web3Like: { utils: { toChecksumAddress: (value: string) => string } },
  value: string,
  fieldName: string,
): `0x${string}` {
  try {
    return web3Like.utils.toChecksumAddress(value) as `0x${string}`;
  } catch {
    throw new Error(`Invalid ${fieldName} address: ${value}`);
  }
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
    resolutionThreshold: bigint,
    initialLiquidityWei: bigint,
    fromAddress: string,
  ): Promise<{
    logs?: Array<{ address?: string; data?: string; topics?: string[] }>;
  }> {
    this.isInitialized();
    const normalizedCollateralAddress = normalizeAddress(
      this.web3,
      collateralAddress,
      'collateral',
    );
    const normalizedFromAddress = normalizeAddress(
      this.web3,
      fromAddress,
      'wallet',
    );

    // Approve governor to spend collateral before propose (required when initialLiquidity > 0).
    // Matches common-protocol prediction_market_helpers_frontend: approve then propose.
    if (initialLiquidityWei > 0n) {
      const collateralToken = new this.web3.eth.Contract(
        erc20Abi as unknown as AbiItem[],
        normalizedCollateralAddress,
      );
      const spender = this.contractAddress;
      const currentAllowance = BigInt(
        (await collateralToken.methods
          .allowance(normalizedFromAddress, spender)
          .call()) as string,
      );
      if (currentAllowance < initialLiquidityWei) {
        try {
          // Some collateral / protocol flows may consume allowance in multiple transferFrom calls.
          // Approve max allowance to avoid false "exceeds allowance" reverts at propose time.
          // Note: this grants permission to pull more than initialLiquidityWei, even though
          // propose() still passes initialLiquidityWei as the intended amount to transfer.
          await collateralToken.methods
            .approve(
              spender,
              '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            )
            .send({ from: normalizedFromAddress });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (/user rejected|denied|reject/i.test(msg)) {
            throw new Error('Approval was rejected by the user.');
          }
          if (/insufficient funds|not enough balance/i.test(msg)) {
            throw new Error('Insufficient collateral balance for approval.');
          }
          throw err;
        }
      }
      const currentBalance = BigInt(
        (await collateralToken.methods
          .balanceOf(normalizedFromAddress)
          .call()) as string,
      );
      if (currentBalance < initialLiquidityWei) {
        throw new Error(
          'Insufficient collateral balance for initial liquidity.',
        );
      }
    }

    const tx = this.contract.methods.propose(
      proposalId,
      marketId,
      normalizedCollateralAddress,
      durationSeconds,
      resolutionThreshold,
      initialLiquidityWei,
    );
    try {
      const gas = await tx.estimateGas({ from: normalizedFromAddress });
      return await tx.send({
        from: normalizedFromAddress,
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
      const revertReason = formatRevertReason(err);
      if (revertReason) {
        throw new Error(revertReason);
      }
      throw err;
    }
  }

  /**
   * Propose a new market, decode events, and return the payload for deployPredictionMarket mutation.
   */
  async deploy(params: DeployParams): Promise<DeployPredictionMarketPayload> {
    this.isInitialized();
    const normalizedCollateralAddress = normalizeAddress(
      this.web3,
      params.collateral_address,
      'collateral',
    );
    const normalizedUserAddress = normalizeAddress(
      this.web3,
      params.user_address,
      'wallet',
    );
    const proposalId = randomBytes32();
    const marketId = randomBytes32();
    const durationDays = Math.max(1, Math.floor(params.duration_days || 1));
    const durationSeconds = BigInt(durationDays) * 86400n;
    // Contract expects resolution threshold in 1e18 scale
    if (
      !Number.isFinite(params.resolution_threshold) ||
      params.resolution_threshold <= 0 ||
      params.resolution_threshold >= 1
    ) {
      throw new Error('Resolution threshold must be between 0 and 1.');
    }
    const resolutionThresholdWei = parseTokenAmount(
      params.resolution_threshold.toString(),
      18,
    );

    let initialLiquidityWei = 0n;
    if (
      params.initial_liquidity_wei !== undefined &&
      params.initial_liquidity_wei !== null
    ) {
      initialLiquidityWei = BigInt(params.initial_liquidity_wei);
    } else {
      // Use collateral token decimals so amount matches balance
      const liquidityInput = params.initial_liquidity?.trim();
      if (liquidityInput && liquidityInput !== '0') {
        const collateralToken = new this.web3.eth.Contract(
          erc20Abi as unknown as AbiItem[],
          normalizedCollateralAddress,
        );
        const decimals = Number(
          (await collateralToken.methods.decimals().call()) as string | number,
        );
        const decimalsNum =
          typeof decimals === 'number' && !Number.isNaN(decimals)
            ? decimals
            : 18;
        initialLiquidityWei = parseTokenAmount(liquidityInput, decimalsNum);
      }
    }
    if (initialLiquidityWei <= 0n) {
      throw new Error(
        'Initial liquidity must be greater than 0 for on-chain deployment.',
      );
    }

    const rawReceipt = await this.propose(
      proposalId,
      marketId,
      normalizedCollateralAddress,
      durationSeconds,
      resolutionThresholdWei,
      initialLiquidityWei,
      normalizedUserAddress,
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
      proposal_id: proposalId,
      market_id: marketId,
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

  /**
   * Get current TWAP probability for a proposal (1e18 scale, e.g. 0.55e18 = 55% PASS).
   */
  async getCurrentProbability(
    proposalId: `0x${string}`,
    twapWindowSeconds: number,
  ): Promise<bigint> {
    this.isInitialized();
    const result = (await this.contract.methods
      .getCurrentProbability(proposalId, twapWindowSeconds)
      .call()) as unknown;
    return BigInt(String(result));
  }

  /**
   * Resolve a proposal on-chain via TWAP. Returns the winner (1=PASS, 2=FAIL).
   */
  async resolve(
    proposalId: `0x${string}`,
    twapWindowSeconds: number,
    fromAddress: string,
  ): Promise<{ winner: number }> {
    this.isInitialized();
    const tx = this.contract.methods.resolve(proposalId, twapWindowSeconds);
    let rawReceipt: {
      logs?: Array<{ address?: string; data?: string; topics?: string[] }>;
    };
    try {
      const gas = await tx.estimateGas({ from: fromAddress });
      rawReceipt = await tx.send({
        from: fromAddress,
        gas: String(BigInt(gas.toString()) + 50000n),
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

    const logs: Array<{ address: string; data: string; topics: string[] }> = (
      rawReceipt.logs ?? []
    ).map((log: { address?: string; data?: string; topics?: string[] }) => ({
      address: log.address ?? '',
      data: log.data ?? '0x',
      topics: Array.isArray(log.topics) ? log.topics : [],
    }));

    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: FutarchyGovernorAbi,
          data: log.data as `0x${string}`,
          topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
          strict: false,
        });
        if (decoded.eventName === 'ProposalResolved') {
          const args = decoded.args as unknown as { winner?: number | bigint };
          return { winner: Number(args.winner ?? 0) };
        }
      } catch {
        // not ProposalResolved
      }
    }
    throw new Error('ProposalResolved event not found in transaction receipt');
  }
}

export default PredictionMarket;
