import {
  TokenBondingCurveABI,
  TokenLaunchpadABI,
} from '@commonxyz/common-protocol-abis';
import { commonProtocol as cp, erc20Abi } from '@hicommonwealth/evm-protocols';
import { Contract } from 'web3';
import ContractBase from './ContractBase';

class TokenLaunchpad extends ContractBase {
  private paymentTokenContract: any;
  launchpadFactoryAddress: string;
  launchpadFactory: Contract<typeof TokenLaunchpadABI>;

  constructor(
    launchpadFactoryAddress: string, // use chainConfig.postTokenLaunchpad
    bondingCurveAddress: string, // use chainConfig.postTokenBondingCurve
    paymentTokenAddress: string, // communities payment token
    rpc: string,
  ) {
    super(bondingCurveAddress, TokenBondingCurveABI, rpc);
    this.launchpadFactory = new this.web3.eth.Contract(
      TokenLaunchpadABI,
      launchpadFactoryAddress,
    );
    this.launchpadFactoryAddress = launchpadFactoryAddress;
    this.paymentTokenContract = new this.web3.eth.Contract(
      erc20Abi,
      paymentTokenAddress,
    );
  }

  async launchTokenWithLiquidity(
    name: string,
    symbol: string,
    walletAddress: string,
    tokenCommunityManager: string,
    threadId: number,
    exchangeToken: string,
    chainId: string,
  ) {
    try {
      if (!this.initialized || !this.walletEnabled) {
        await this.initialize(true, chainId);
      }

      return await cp.launchPostToken(
        this.launchpadFactory,
        name,
        symbol,
        [],
        [],
        this.web3.utils.toWei('1e9', 'ether'), // Default 1B tokens
        walletAddress,
        830000,
        tokenCommunityManager,
        threadId,
        exchangeToken,
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
      return await cp.buyPostToken(
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
      return await cp.sellPostToken(
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
      return await cp.transferPostLiquidity(
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

    const amountOut = await cp.getPostPrice(
      this.contract,
      postTokenAddress,
      amountIn,
      buy,
    );
    return Number(amountOut) / 1e18;
  }
}

export default TokenLaunchpad;
