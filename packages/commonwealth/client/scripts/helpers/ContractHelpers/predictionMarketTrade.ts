/**
 * Prediction market trade helpers: mint, swap, merge, redeem via BinaryVault and FutarchyRouter.
 * Uses the same wallet/Web3 init pattern as predictionMarket.ts (Governor).
 */
import {
  BinaryVaultAbi,
  FutarchyRouterAbi,
} from '@commonxyz/common-protocol-abis';
import { erc20Abi } from '@hicommonwealth/evm-protocols';
import Web3 from 'web3';
import type { AbiItem } from 'web3-utils';
import ContractBase from './ContractBase';

/** Ensure market_id is 0x-prefixed 32-byte hex (64 hex chars). */
export function marketIdToBytes32(marketId: string): `0x${string}` {
  const hex = marketId.startsWith('0x') ? marketId.slice(2) : marketId;
  const padded = hex.padStart(64, '0').slice(-64);
  return `0x${padded}` as `0x${string}`;
}

/** Parse human-readable token amount to smallest units. */
export function parseTokenAmount(value: string, decimals: number): bigint {
  if (!value || value.trim() === '') return 0n;
  const trimmed = value.trim();
  const dot = trimmed.indexOf('.');
  const whole = dot === -1 ? trimmed : trimmed.slice(0, dot);
  const frac = dot === -1 ? '' : trimmed.slice(dot + 1).slice(0, decimals);
  const combined = whole + frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(combined || '0');
}

/** Apply slippage to get minimum output (e.g. 1% slippage => minOut = amount * 0.99). */
export function applySlippage(amount: bigint, slippageBps: number): bigint {
  return (amount * BigInt(10000 - slippageBps)) / 10000n;
}

export type TradeParams = {
  vault_address: string;
  router_address: string;
  collateral_address: string;
  p_token_address: string;
  f_token_address: string;
  market_id: string;
  chain_rpc: string;
  eth_chain_id: number;
  user_address: string;
  provider?: unknown;
};

async function approveToken(
  web3: Web3,
  tokenAddress: string,
  spender: string,
  amount: bigint,
  fromAddress: string,
): Promise<void> {
  const token = new web3.eth.Contract(
    erc20Abi as unknown as AbiItem[],
    tokenAddress,
  );
  const currentAllowance = BigInt(
    (await token.methods.allowance(fromAddress, spender).call()) as string,
  );
  if (currentAllowance < amount) {
    const tx = token.methods.approve(spender, amount);
    await tx.send({ from: fromAddress });
  }
}

class BinaryVaultHelper extends ContractBase {
  constructor(vaultAddress: string, rpc: string) {
    super(vaultAddress, BinaryVaultAbi as unknown as AbiItem[], rpc);
  }

  async mint(
    marketIdBytes: `0x${string}`,
    amountWei: bigint,
    collateralAddress: string,
    fromAddress: string,
  ): Promise<{ transactionHash: string }> {
    this.isInitialized();
    await approveToken(
      this.web3,
      collateralAddress,
      this.contractAddress,
      amountWei,
      fromAddress,
    );
    const receipt = await this.contract.methods
      .mint(marketIdBytes, amountWei.toString(10))
      .send({ from: fromAddress });
    return { transactionHash: receipt.transactionHash as string };
  }

  async merge(
    marketIdBytes: `0x${string}`,
    amountWei: bigint,
    pTokenAddress: string,
    fTokenAddress: string,
    fromAddress: string,
  ): Promise<{ transactionHash: string }> {
    this.isInitialized();
    await approveToken(
      this.web3,
      pTokenAddress,
      this.contractAddress,
      amountWei,
      fromAddress,
    );
    await approveToken(
      this.web3,
      fTokenAddress,
      this.contractAddress,
      amountWei,
      fromAddress,
    );
    const receipt = await this.contract.methods
      .merge(marketIdBytes, amountWei.toString(10))
      .send({ from: fromAddress });
    return { transactionHash: receipt.transactionHash as string };
  }

  async redeem(
    marketIdBytes: `0x${string}`,
    amountWei: bigint,
    winningTokenAddress: string,
    fromAddress: string,
  ): Promise<{ transactionHash: string }> {
    this.isInitialized();
    await approveToken(
      this.web3,
      winningTokenAddress,
      this.contractAddress,
      amountWei,
      fromAddress,
    );
    const receipt = await this.contract.methods
      .redeem(marketIdBytes, amountWei.toString(10))
      .send({ from: fromAddress });
    return { transactionHash: receipt.transactionHash as string };
  }
}

class FutarchyRouterHelper extends ContractBase {
  constructor(routerAddress: string, rpc: string) {
    super(routerAddress, FutarchyRouterAbi as unknown as AbiItem[], rpc);
  }

  async swap(
    marketIdBytes: `0x${string}`,
    buyPass: boolean,
    amountInWei: bigint,
    minAmountOutWei: bigint,
    tokenInAddress: string,
    fromAddress: string,
  ): Promise<{ transactionHash: string }> {
    this.isInitialized();
    await approveToken(
      this.web3,
      tokenInAddress,
      this.contractAddress,
      amountInWei,
      fromAddress,
    );
    const receipt = await this.contract.methods
      .swap(
        marketIdBytes,
        buyPass,
        amountInWei.toString(10),
        minAmountOutWei.toString(10),
      )
      .send({ from: fromAddress });
    return { transactionHash: receipt.transactionHash as string };
  }
}

/**
 * Execute mint: approve collateral to vault, then vault.mint(marketId, amount).
 */
export async function mintTokens(
  params: TradeParams & { collateral_amount_wei: bigint },
): Promise<{ transactionHash: string }> {
  const marketIdBytes = marketIdToBytes32(params.market_id);
  const vault = new BinaryVaultHelper(params.vault_address, params.chain_rpc);
  await vault.initialize(true, String(params.eth_chain_id), params.provider);
  return vault.mint(
    marketIdBytes,
    params.collateral_amount_wei,
    params.collateral_address,
    params.user_address,
  );
}

/**
 * Execute swap: approve tokenIn to router, then router.swap(marketId, buyPass, amountIn, minAmountOut).
 */
export async function swapTokens(
  params: TradeParams & {
    buy_pass: boolean;
    amount_in_wei: bigint;
    min_amount_out_wei: bigint;
  },
): Promise<{ transactionHash: string }> {
  const marketIdBytes = marketIdToBytes32(params.market_id);
  const tokenIn = params.buy_pass
    ? params.f_token_address
    : params.p_token_address;
  const router = new FutarchyRouterHelper(
    params.router_address,
    params.chain_rpc,
  );
  await router.initialize(true, String(params.eth_chain_id), params.provider);
  return router.swap(
    marketIdBytes,
    params.buy_pass,
    params.amount_in_wei,
    params.min_amount_out_wei,
    tokenIn,
    params.user_address,
  );
}

/**
 * Execute merge: approve both p and f token to vault, then vault.merge(marketId, amount).
 */
export async function mergeTokens(
  params: TradeParams & { amount_wei: bigint },
): Promise<{ transactionHash: string }> {
  const marketIdBytes = marketIdToBytes32(params.market_id);
  const vault = new BinaryVaultHelper(params.vault_address, params.chain_rpc);
  await vault.initialize(true, String(params.eth_chain_id), params.provider);
  return vault.merge(
    marketIdBytes,
    params.amount_wei,
    params.p_token_address,
    params.f_token_address,
    params.user_address,
  );
}

/**
 * Execute redeem: approve winning token to vault, then vault.redeem(marketId, amount).
 */
export async function redeemTokens(
  params: TradeParams & { amount_wei: bigint; winner: 1 | 2 },
): Promise<{ transactionHash: string }> {
  const marketIdBytes = marketIdToBytes32(params.market_id);
  const winningToken =
    params.winner === 1 ? params.p_token_address : params.f_token_address;
  const vault = new BinaryVaultHelper(params.vault_address, params.chain_rpc);
  await vault.initialize(true, String(params.eth_chain_id), params.provider);
  return vault.redeem(
    marketIdBytes,
    params.amount_wei,
    winningToken,
    params.user_address,
  );
}
