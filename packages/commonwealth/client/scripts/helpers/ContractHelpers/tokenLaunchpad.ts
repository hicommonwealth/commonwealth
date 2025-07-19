import {
  TokenBondingCurveAbi,
  TokenLaunchpadAbi,
} from '@commonxyz/common-protocol-abis';
import {
  buyPostToken,
  erc20Abi,
  getPostPrice,
  launchPostToken,
  sellPostToken,
  transferPostLiquidity,
} from '@hicommonwealth/evm-protocols';
import { Contract } from 'web3';
import ContractBase from './ContractBase';

class TokenLaunchpad extends ContractBase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private paymentTokenContract: any;
  launchpadFactoryAddress: string;
  paymentTokenAddress: string;
  launchpadFactory: Contract<typeof TokenLaunchpadAbi>;

  constructor(
    launchpadFactoryAddress: string, // use chainConfig.postTokenLaunchpad
    bondingCurveAddress: string, // use chainConfig.postTokenBondingCurve
    paymentTokenAddress: string, // communities payment token
    rpc: string,
  ) {
    super(bondingCurveAddress, TokenBondingCurveAbi, rpc);
    this.LaunchpadFactoryAddress = launchpadFactoryAddress;
    this.paymentTokenAddress = paymentTokenAddress;
    this.LaunchpadFactoryAddress = launchpadFactoryAddress;
  }

  async initialize(
    withWallet?: boolean,
    chainId?: string | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ): Promise<void> {
    await super.initialize(withWallet, chainId, providerInstance);
    this.LaunchpadFactory = new this.web3.eth.Contract(
      TokenLaunchpadAbi,
      this.LaunchpadFactoryAddress,
    );
    this.paymentTokenContract = new this.web3.eth.Contract(
      erc20Abi,
      this.paymentTokenAddress,
    );
  }

  async launchTokenWithLiquidity(
    name: string,
    symbol: string,
    walletAddress: string,
    threadId: number,
    exchangeToken: string,
    chainId: string,
    initPurchaseAmount: number,
    authorAddress: string,
    communityTreasuryAddress: string,
  ) {
    try {
      if (!this.initialized || !this.walletEnabled) {
        await this.initialize(true, chainId);
      }

      return await launchPostToken(
        this.LaunchpadFactory,
        name,
        symbol,
        [8250, 1550, 100, 100],
        [authorAddress, communityTreasuryAddress],
        this.web3.utils.toWei('1000000000', 'ether'), // Default 1B tokens
        walletAddress,
        830000,
        threadId,
        exchangeToken,
        initPurchaseAmount,
        this.contract.options.address as string,
        this.paymentTokenContract,
      );
    } catch (error) {
      console.error('Error launching token with liquidity:', error);
      throw error;
    }
  }

  async buyTokens(
    postTokenAddress: string,
    recipient: string,
    amountIn: string,
    minAmountOut: string,
    walletAddress: string,
  ) {
    try {
      if (!this.initialized || !this.walletEnabled) {
        await this.initialize(true);
      }
      return await buyPostToken(
        this.contract,
        postTokenAddress,
        recipient,
        amountIn,
        minAmountOut,
        walletAddress,
        this.paymentTokenContract,
      );
    } catch (error) {
      console.error('Error buying tokens:', error);
      throw error;
    }
  }

  async sellTokens(
    postTokenAddress: string,
    amount: string,
    minAmountOut: string,
    walletAddress: string,
  ) {
    try {
      if (!this.initialized || !this.walletEnabled) {
        await this.initialize(true);
      }
      return await sellPostToken(
        this.contract,
        postTokenAddress,
        amount,
        minAmountOut,
        walletAddress,
        new this.web3.eth.Contract(erc20Abi, postTokenAddress),
      );
    } catch (error) {
      console.error('Error selling tokens:', error);
      throw error;
    }
  }

  async transferLiquidityToPool(
    tokenAddress: string,
    amountIn: string,
    minAmountOut: string,
    walletAddress: string,
  ) {
    try {
      if (!this.initialized || !this.walletEnabled) {
        await this.initialize(true);
      }
      return await transferPostLiquidity(
        this.contract,
        tokenAddress,
        amountIn,
        minAmountOut,
        walletAddress,
        this.paymentTokenContract,
      );
    } catch (error) {
      console.error('Error transferring liquidity to pool:', error);
      throw error;
    }
  }
  async getAmountOut(
    postTokenAddress: string,
    amountIn: number,
    buy: boolean,
    chainId: string,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId);
    }

    const amountOut = await getPostPrice(
      this.contract,
      postTokenAddress,
      amountIn,
      buy,
    );
    return Number(amountOut) / 1e18;
  }
}

export default TokenLaunchpad;
