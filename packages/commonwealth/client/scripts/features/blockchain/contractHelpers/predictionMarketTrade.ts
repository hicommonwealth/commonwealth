/**
 * Prediction market trade helpers: mint, swap, merge, redeem via BinaryVault and FutarchyRouter.
 * Uses the same wallet/Web3 init pattern as predictionMarket.ts (Governor).
 */
import {
  BinaryVaultAbi,
  FutarchyRouterAbi,
  UniswapV3StrategyAbi,
} from '@commonxyz/common-protocol-abis';
import { erc20Abi } from '@hicommonwealth/evm-protocols';
import Web3 from 'web3';
import type { AbiItem } from 'web3-utils';
import ContractBase from './ContractBase';

/** Uniswap V3 QuoterV2 — same canonical addresses on each chain (see Uniswap deploy docs). */
export const UNISWAP_V3_QUOTER_V2_BY_CHAIN_ID: Record<number, string> = {
  // Ethereum mainnet
  1: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  // Base
  8453: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
  // Base Sepolia
  84532: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27',
};

const QUOTER_V2_ABI: AbiItem[] = [
  {
    type: 'function',
    name: 'quoteExactInputSingle',
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
];

function quoterResultToAmountOut(result: unknown): bigint {
  if (result == null) throw new Error('Quoter returned empty result');
  if (typeof result === 'object' && !Array.isArray(result)) {
    const obj = result as Record<string, unknown>;
    if ('amountOut' in obj) return BigInt(String(obj.amountOut));
  }
  if (Array.isArray(result)) return BigInt(String(result[0]));
  return BigInt(String(result));
}

/** Ensure market_id is 0x-prefixed 32-byte hex (64 hex chars). */
export function marketIdToBytes32(marketId: string): `0x${string}` {
  const hex = marketId.startsWith('0x') ? marketId.slice(2) : marketId;
  const padded = hex.padStart(64, '0').slice(-64);
  return `0x${padded}` as `0x${string}`;
}

/**
 * Fetch market_id from the vault's MarketCreated event logs (for markets deployed before we stored market_id).
 * Returns the first marketId found for the given vault + pToken + fToken, or null.
 */
export async function fetchMarketIdFromChain(
  vaultAddress: string,
  pTokenAddress: string,
  fTokenAddress: string,
  chainRpc: string,
): Promise<string | null> {
  const web3 = new Web3(chainRpc);
  const eventSig = (
    web3 as unknown as { utils: { sha3: (s: string) => string } }
  ).utils.sha3('MarketCreated(bytes32,address,address,address)');
  if (!eventSig) return null;
  const padAddr = (a: string) => {
    const hex = a.toLowerCase().replace(/^0x/, '');
    return '0x' + hex.padStart(64, '0').slice(-64);
  };
  const logs = await web3.eth.getPastLogs({
    address: vaultAddress,
    fromBlock: 0,
    toBlock: 'latest',
    topics: [eventSig, null, padAddr(pTokenAddress), padAddr(fTokenAddress)],
  });
  const first = logs[0];
  const marketIdTopic =
    first && typeof first === 'object' && Array.isArray(first.topics)
      ? first.topics[1]
      : null;
  if (!marketIdTopic) return null;
  return marketIdTopic as string;
}

/**
 * Fetch PASS and FAIL token balances for a user from chain (fallback when API has no position).
 * Returns balances in wei (bigint).
 */
export async function getPredictionMarketBalancesFromChain(
  chainRpc: string,
  userAddress: string,
  pTokenAddress: string,
  fTokenAddress: string,
): Promise<{ pTokenBalanceWei: bigint; fTokenBalanceWei: bigint }> {
  const web3 = new Web3(chainRpc);
  const balanceOfAbi: AbiItem = {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  };
  const [pRaw, fRaw] = await Promise.all([
    new web3.eth.Contract([balanceOfAbi], pTokenAddress).methods
      .balanceOf(userAddress)
      .call(),
    new web3.eth.Contract([balanceOfAbi], fTokenAddress).methods
      .balanceOf(userAddress)
      .call(),
  ]);
  return {
    pTokenBalanceWei: BigInt(String(pRaw ?? 0)),
    fTokenBalanceWei: BigInt(String(fRaw ?? 0)),
  };
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Fetch collateral ERC20 balance and symbol for the Mint tab.
 * The vault pulls this token; user must hold it (e.g. WETH), not just native ETH.
 */
export async function getCollateralBalanceAndSymbol(
  chainRpc: string,
  userAddress: string,
  collateralAddress: string,
): Promise<{ balanceWei: bigint; symbol: string; decimals: number }> {
  if (
    !collateralAddress ||
    collateralAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase()
  ) {
    return { balanceWei: 0n, symbol: 'ETH', decimals: 18 };
  }
  const web3 = new Web3(chainRpc);
  const erc20AbiSlice: AbiItem[] = [
    {
      name: 'balanceOf',
      type: 'function',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
    {
      name: 'decimals',
      type: 'function',
      inputs: [],
      outputs: [{ name: '', type: 'uint8' }],
    },
    {
      name: 'symbol',
      type: 'function',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
    },
  ];
  const contract = new web3.eth.Contract(erc20AbiSlice, collateralAddress);
  const [balance, decimals, symbol] = await Promise.all([
    contract.methods.balanceOf(userAddress).call(),
    contract.methods.decimals().call(),
    contract.methods
      .symbol()
      .call()
      .catch(() => ''),
  ]);
  const decimalsNum = Number(decimals ?? 18);
  return {
    balanceWei: BigInt(String(balance ?? 0)),
    symbol: (symbol as string) || 'Token',
    decimals: decimalsNum,
  };
}

/**
 * Fetch the vault's total balance of the collateral token on-chain. This is the
 * sum across all markets that share this vault, not per-market. For "Total minted"
 * per thread/market, use the API's market.total_collateral instead.
 */
export async function getVaultCollateralBalance(
  chainRpc: string,
  vaultAddress: string,
  collateralAddress: string,
): Promise<{ balanceWei: bigint; symbol: string; decimals: number }> {
  if (
    !vaultAddress ||
    !collateralAddress ||
    collateralAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase()
  ) {
    return { balanceWei: 0n, symbol: 'ETH', decimals: 18 };
  }
  return getCollateralBalanceAndSymbol(
    chainRpc,
    vaultAddress,
    collateralAddress,
  );
}

/**
 * Compute market-specific locked collateral from vault events:
 * minted - merged - redeemed for a single marketId.
 */
export async function getMarketCollateralBalanceFromLogs(
  chainRpc: string,
  vaultAddress: string,
  marketId: string,
): Promise<bigint> {
  if (!chainRpc || !vaultAddress || !marketId) return 0n;

  const web3 = new Web3(chainRpc);
  const marketTopic = marketIdToBytes32(marketId).toLowerCase();
  const sigMinted = (
    web3 as unknown as { utils: { sha3: (s: string) => string } }
  ).utils.sha3('TokensMinted(bytes32,address,uint256)');
  const sigMerged = (
    web3 as unknown as { utils: { sha3: (s: string) => string } }
  ).utils.sha3('TokensMerged(bytes32,address,uint256)');
  const sigRedeemed = (
    web3 as unknown as { utils: { sha3: (s: string) => string } }
  ).utils.sha3('TokensRedeemed(bytes32,address,uint256,uint8)');
  if (!sigMinted || !sigMerged || !sigRedeemed) return 0n;

  const [mintedLogs, mergedLogs, redeemedLogs] = await Promise.all([
    web3.eth.getPastLogs({
      address: vaultAddress,
      fromBlock: 0,
      toBlock: 'latest',
      topics: [sigMinted, marketTopic],
    }),
    web3.eth.getPastLogs({
      address: vaultAddress,
      fromBlock: 0,
      toBlock: 'latest',
      topics: [sigMerged, marketTopic],
    }),
    web3.eth.getPastLogs({
      address: vaultAddress,
      fromBlock: 0,
      toBlock: 'latest',
      topics: [sigRedeemed, marketTopic],
    }),
  ]);

  const sumSingleUintLogData = (logs: Array<{ data?: string } | string>) =>
    logs.reduce((acc, log) => {
      if (typeof log === 'string' || !log.data) return acc;
      const decoded = web3.eth.abi.decodeParameter('uint256', log.data);
      return acc + BigInt(String(decoded ?? 0));
    }, 0n);

  const sumRedeemedLogData = (logs: Array<{ data?: string } | string>) =>
    logs.reduce((acc, log) => {
      if (typeof log === 'string' || !log.data) return acc;
      const decoded = web3.eth.abi.decodeParameters(
        ['uint256', 'uint8'],
        log.data,
      );
      return acc + BigInt(String(decoded?.[0] ?? 0));
    }, 0n);

  const minted = sumSingleUintLogData(mintedLogs);
  const merged = sumSingleUintLogData(mergedLogs);
  const redeemed = sumRedeemedLogData(redeemedLogs);
  const net = minted - merged - redeemed;
  return net > 0n ? net : 0n;
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

const GAS_PRICE_MULTIPLIER_NUMERATOR = 2n;
const GAS_PRICE_MULTIPLIER_DENOMINATOR = 1n;
const MIN_GAS_PRICE_WEI = 5_000_000_000n; // 5 gwei floor for faster inclusion on congested mempools.

async function getAggressiveGasPriceWei(web3: Web3): Promise<string> {
  const networkGasPrice = BigInt(await web3.eth.getGasPrice());
  const boostedGasPrice =
    (networkGasPrice * GAS_PRICE_MULTIPLIER_NUMERATOR) /
    GAS_PRICE_MULTIPLIER_DENOMINATOR;
  const finalGasPriceWei =
    boostedGasPrice > MIN_GAS_PRICE_WEI ? boostedGasPrice : MIN_GAS_PRICE_WEI;
  return finalGasPriceWei.toString(10);
}

function extractTransactionHash(input: string): string | null {
  const match = input.match(/0x[a-fA-F0-9]{64}/);
  return match ? match[0] : null;
}

function extractTransactionHashFromUnknown(input: unknown): string | null {
  if (!input) return null;
  if (typeof input === 'string') return extractTransactionHash(input);
  if (typeof input !== 'object') return null;

  const candidate = input as {
    transactionHash?: unknown;
    receipt?: unknown;
    data?: unknown;
    cause?: unknown;
    error?: unknown;
    message?: unknown;
  };

  if (typeof candidate.transactionHash === 'string') {
    const parsed = extractTransactionHash(candidate.transactionHash);
    if (parsed) return parsed;
  }
  if (typeof candidate.message === 'string') {
    const parsed = extractTransactionHash(candidate.message);
    if (parsed) return parsed;
  }

  return (
    extractTransactionHashFromUnknown(candidate.receipt) ??
    extractTransactionHashFromUnknown(candidate.data) ??
    extractTransactionHashFromUnknown(candidate.cause) ??
    extractTransactionHashFromUnknown(candidate.error)
  );
}

function extractReceiptStatus(input: unknown): boolean | null {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as {
    status?: unknown;
    receipt?: unknown;
    data?: unknown;
    cause?: unknown;
    error?: unknown;
  };

  if (typeof candidate.status === 'boolean') return candidate.status;
  if (typeof candidate.status === 'string') {
    if (candidate.status === '0x1' || candidate.status === '1') return true;
    if (candidate.status === '0x0' || candidate.status === '0') return false;
  }

  return (
    extractReceiptStatus(candidate.receipt) ??
    extractReceiptStatus(candidate.data) ??
    extractReceiptStatus(candidate.cause) ??
    extractReceiptStatus(candidate.error)
  );
}

async function getReceiptStatusIfAvailable(
  web3: Web3,
  txHash: string | null,
): Promise<boolean | null> {
  if (!txHash) return null;
  try {
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    if (!receipt) return null;
    return Boolean(receipt.status);
  } catch {
    return null;
  }
}

function mapTransactionError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const lowered = raw.toLowerCase();
  const txHash = extractTransactionHash(raw);
  const txHint = txHash ? ` Tx hash: ${txHash}` : '';

  if (
    /user denied|user rejected|rejected the transaction|denied transaction/i.test(
      raw,
    )
  ) {
    return 'Transaction was rejected in your wallet.';
  }
  if (/insufficient funds|not enough funds|exceeds balance/i.test(raw)) {
    return 'Insufficient balance to cover the transaction and network fee.';
  }
  if (
    lowered.includes('not mined within') ||
    lowered.includes('transaction was not mined') ||
    lowered.includes('transaction still pending')
  ) {
    return (
      'Transaction was submitted but not mined in time. ' +
      'This usually means gas fee is too low or an older pending nonce is blocking this account. ' +
      `Check wallet activity, speed up/cancel the oldest pending tx, then retry.${txHint}`
    );
  }
  if (
    lowered.includes('nonce too low') ||
    lowered.includes('replacement transaction underpriced') ||
    lowered.includes('already known')
  ) {
    return (
      'A pending transaction with this account nonce is blocking or conflicting with this one. ' +
      `Speed up/cancel the pending tx in your wallet and retry.${txHint}`
    );
  }
  if (
    lowered.includes('max fee per gas less than block base fee') ||
    lowered.includes('fee cap less than block base fee') ||
    lowered.includes('underpriced')
  ) {
    return 'Network fee is too low for current conditions. Increase gas fee in wallet settings and retry.';
  }
  return raw || 'Transaction failed.';
}

export type SwapQuoteParams = {
  chain_rpc: string;
  eth_chain_id: number;
  router_address: string;
  market_id: string;
  buy_pass: boolean;
  amount_in_wei: bigint;
  p_token_address: string;
  f_token_address: string;
};

/**
 * Expected output amount for an exact-in swap on the market's Uniswap V3 pool (via strategy POOL_FEE).
 * Use this (not amountIn) as the base for minOut after slippage.
 */
export async function quoteSwapAmountOut(
  params: SwapQuoteParams,
): Promise<bigint> {
  const quoterAddress = UNISWAP_V3_QUOTER_V2_BY_CHAIN_ID[params.eth_chain_id];
  if (!quoterAddress) {
    throw new Error(
      `Uniswap V3 QuoterV2 is not configured for chain id ${params.eth_chain_id}`,
    );
  }
  const web3 = new Web3(params.chain_rpc);
  const marketIdBytes = marketIdToBytes32(params.market_id);
  const router = new web3.eth.Contract(
    FutarchyRouterAbi as unknown as AbiItem[],
    params.router_address,
  );
  const strategyAddress = (await router.methods
    .getStrategy(marketIdBytes)
    .call()) as string;
  if (
    !strategyAddress ||
    strategyAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase()
  ) {
    throw new Error('No strategy registered for this market');
  }
  const strategy = new web3.eth.Contract(
    UniswapV3StrategyAbi as unknown as AbiItem[],
    strategyAddress,
  );
  const poolFeeRaw = await strategy.methods.POOL_FEE().call();
  const poolFee = Number(poolFeeRaw);
  const tokenIn = params.buy_pass
    ? params.f_token_address
    : params.p_token_address;
  const tokenOut = params.buy_pass
    ? params.p_token_address
    : params.f_token_address;

  const quoter = new web3.eth.Contract(QUOTER_V2_ABI, quoterAddress);
  const result = await quoter.methods
    .quoteExactInputSingle({
      tokenIn,
      tokenOut,
      amountIn: params.amount_in_wei.toString(10),
      fee: poolFee,
      sqrtPriceLimitX96: '0',
    })
    .call();
  return quoterResultToAmountOut(result);
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
    try {
      const gas = await tx.estimateGas({ from: fromAddress });
      const gasPrice = await getAggressiveGasPriceWei(web3);
      await tx.send({
        from: fromAddress,
        gas: String(BigInt(gas.toString()) + 100000n),
        gasPrice,
      });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err ?? '');
      const txHash =
        extractTransactionHashFromUnknown(err) ??
        extractTransactionHash(rawMessage);
      const receiptStatus = extractReceiptStatus(err);
      if (receiptStatus === true) return;
      const status = await getReceiptStatusIfAvailable(web3, txHash);
      if (status === true) return;
      throw new Error(mapTransactionError(err));
    }
  }
}

/** Send tx with estimated gas + buffer (matches deploy flow to avoid inflated provider estimates). */
async function sendWithEstimatedGas(
  web3: Web3,
  tx: {
    estimateGas: (opts: { from: string }) => Promise<unknown>;
    send: (opts: {
      from: string;
      gas: string;
      gasPrice: string;
    }) => Promise<{ transactionHash: string }>;
  },
  fromAddress: string,
): Promise<{ transactionHash: string }> {
  try {
    const gas = await tx.estimateGas({ from: fromAddress });
    const gasPrice = await getAggressiveGasPriceWei(web3);
    // Slightly over-estimate to reduce risk of borderline out-of-gas / network variance.
    const gasLimit = BigInt(gas as unknown as string) + 200000n;
    return await tx.send({
      from: fromAddress,
      gas: String(gasLimit),
      gasPrice,
    });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err ?? '');
    const txHash =
      extractTransactionHashFromUnknown(err) ??
      extractTransactionHash(rawMessage);
    const receiptStatus = extractReceiptStatus(err);
    if (receiptStatus === true) {
      return { transactionHash: txHash ?? '' };
    }
    const status = await getReceiptStatusIfAvailable(web3, txHash);
    if (status === true && txHash) {
      return { transactionHash: txHash };
    }
    throw new Error(mapTransactionError(err));
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
    const tx = this.contract.methods.mint(
      marketIdBytes,
      amountWei.toString(10),
    );
    return sendWithEstimatedGas(this.web3, tx, fromAddress);
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
    const tx = this.contract.methods.merge(
      marketIdBytes,
      amountWei.toString(10),
    );
    return sendWithEstimatedGas(this.web3, tx, fromAddress);
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
    const tx = this.contract.methods.redeem(
      marketIdBytes,
      amountWei.toString(10),
    );
    return sendWithEstimatedGas(this.web3, tx, fromAddress);
  }
}

class FutarchyRouterHelper extends ContractBase {
  constructor(routerAddress: string, rpc: string) {
    super(routerAddress, FutarchyRouterAbi as unknown as AbiItem[], rpc);
  }

  /** Get strategy address for a market (view call). */
  async getStrategy(marketIdBytes: `0x${string}`): Promise<string> {
    this.isInitialized();
    const addr = (await this.contract.methods
      .getStrategy(marketIdBytes)
      .call()) as string;
    return addr;
  }

  /**
   * Execute swap via the strategy contract (matches app.js / FutarchyGovernor reference).
   * Flow: getStrategy(marketId) → approve token to strategy → strategy.executeSwap(buyPass, amountIn, minOut).
   */
  async swap(
    marketIdBytes: `0x${string}`,
    buyPass: boolean,
    amountInWei: bigint,
    minAmountOutWei: bigint,
    tokenInAddress: string,
    fromAddress: string,
  ): Promise<{ transactionHash: string }> {
    this.isInitialized();
    const strategyAddress = await this.getStrategy(marketIdBytes);
    await approveToken(
      this.web3,
      tokenInAddress,
      strategyAddress,
      amountInWei,
      fromAddress,
    );
    const payload = {
      marketIdBytes,
      buyPass,
      amountInWei: amountInWei.toString(10),
      minAmountOutWei: minAmountOutWei.toString(10),
      tokenInAddress,
      strategyAddress,
      fromAddress,
    };
    console.log('[Strategy.executeSwap] payload:', payload);
    const strategyContract = new this.web3.eth.Contract(
      UniswapV3StrategyAbi as unknown as AbiItem[],
      strategyAddress,
    );
    const tx = strategyContract.methods.executeSwap(
      buyPass,
      amountInWei.toString(10),
      minAmountOutWei.toString(10),
    );
    return sendWithEstimatedGas(this.web3, tx, fromAddress);
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
 * Execute swap: get strategy from router, approve tokenIn to strategy,
 * then strategy.executeSwap(buyPass, amountIn, minOut).
 * Matches app.js / FutarchyGovernor reference (vote via strategy, not router.swap).
 */
export async function swapTokens(
  params: TradeParams & {
    buy_pass: boolean;
    amount_in_wei: bigint;
    min_amount_out_wei: bigint;
  },
): Promise<{ transactionHash: string }> {
  if (!params.user_address?.trim()) {
    throw new Error(
      'Wallet address is missing. Connect an Ethereum wallet and try again.',
    );
  }
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
