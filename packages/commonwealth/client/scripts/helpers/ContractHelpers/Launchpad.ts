import {
  LaunchpadAbi,
  LPBondingCurveAbi,
} from '@commonxyz/common-protocol-abis';
import { commonProtocol as cp, erc20Abi } from '@hicommonwealth/evm-protocols';
import { Contract } from 'web3';
import { AbiItem } from 'web3-utils';
import ContractBase from './ContractBase';

class LaunchpadBondingCurve extends ContractBase {
  tokenAddress: string;
  launchpadFactoryAddress: string;
  launchpadFactory: Contract<typeof LaunchpadAbi>;
  tokenCommunityManager: string;

  constructor(
    bondingCurveAddress: string,
    launchpadFactoryAddress: string,
    tokenAddress: string,
    tokenCommunityManager: string,
    rpc: string,
  ) {
    super(bondingCurveAddress, LPBondingCurveAbi, rpc);
    this.tokenAddress = tokenAddress;
    this.launchpadFactoryAddress = launchpadFactoryAddress;
    this.tokenCommunityManager = tokenCommunityManager;
  }

  async initialize(
    withWallet?: boolean,
    chainId?: string | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ): Promise<void> {
    await super.initialize(withWallet, chainId, providerInstance);
    this.launchpadFactory = new this.web3.eth.Contract(
      LaunchpadAbi,
      this.launchpadFactoryAddress,
    );
  }

  async launchToken(
    name: string,
    symbol: string,
    walletAddress: string,
    chainId: string,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId);
    }
    const initialBuyValue =
      4.44e14 + parseInt(process.env.LAUNCHPAD_INITIAL_PRICE || '416700000');
    const connectorWeight = parseInt(
      process.env.LAUNCHPAD_CONNECTOR_WEIGHT || '830000',
    );
    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await cp.launchToken(
      this.launchpadFactory,
      name,
      symbol,
      [], // 9181 parameters
      // should include at community treasury at [0] and contest creation util at [1] curr tbd
      [],
      this.web3.utils.toWei(1e9, 'ether'), // Default 1B tokens
      walletAddress,
      connectorWeight,
      this.tokenCommunityManager,
      initialBuyValue,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  async buyToken(
    amountEth: number,

    walletAddress: string,

    chainId: string,
    imgUrl?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }
    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await cp.buyToken(
      this.contract,
      this.tokenAddress,
      walletAddress,
      amountEth,
      maxFeePerGas!,
    );

    // Add token to user's wallet after successful purchase
    try {
      const tokenContract = new this.web3.eth.Contract(
        erc20Abi as unknown as AbiItem[],
        this.tokenAddress,
      );

      // Get token details for wallet_watchAsset
      const tokenSymbol = await tokenContract.methods.symbol().call();

      // @ts-expect-error StrictNullChecks
      await this.web3.currentProvider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: this.tokenAddress,
            symbol: tokenSymbol,
            decimals: 18,
            image: imgUrl,
          },
        },
      });
    } catch (error) {
      console.log('Failed to add token to wallet:', error);
      // Continue as this is an enhancement, not a critical functionality
    }

    return txReceipt;
  }

  async sellToken(
    amountSell: number,
    walletAddress: string,
    chainId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const tokenContract = new this.web3.eth.Contract(
      erc20Abi as unknown as AbiItem[],
      this.tokenAddress,
    );
    const maxFeePerGas = await this.estimateGas();
    const txReceipt = await cp.sellToken(
      this.contract,
      this.tokenAddress,
      amountSell,
      walletAddress,
      tokenContract,
      maxFeePerGas!,
    );
    return txReceipt;
  }

  async transferLiquidity(walletAddress: string) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    const txReceipt = await cp.transferLiquidity(
      this.contract,
      this.tokenAddress,
      walletAddress,
    );
    return txReceipt;
  }

  async getAmountOut(amountIn: number, buy: boolean, chainId: string) {
    if (!this.initialized) {
      await this.initialize(false, chainId);
    }

    const amountOut = await cp.getPrice(
      this.contract,
      this.tokenAddress,
      amountIn,
      buy,
    );
    return Number(amountOut) / 1e18;
  }
}

export default LaunchpadBondingCurve;
