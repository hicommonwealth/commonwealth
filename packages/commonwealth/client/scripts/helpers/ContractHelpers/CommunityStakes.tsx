import { CommunityStakeAbi } from '@commonxyz/common-protocol-abis';
import Web3 from 'web3';
import { toBigInt } from 'web3-utils';
import ContractBase from './ContractBase';
import NamespaceFactory from './NamespaceFactory';

export type PriceData = {
  price: string;
  fees: string;
  totalPrice: string;
};

class CommunityStakes extends ContractBase {
  namespaceFactoryAddress: string;
  namespaceFactory: NamespaceFactory;
  addressCache = { address: '0x0', name: '' };

  constructor(
    contractAddress: string,
    factoryAddress: string,
    rpc: string,
    chainId?: string,
  ) {
    super(contractAddress, CommunityStakeAbi, rpc);
    this.namespaceFactoryAddress = factoryAddress;
    this.chainId = chainId || '1';
  }

  async initialize(withWallet: boolean = false): Promise<void> {
    if (this.chainId) {
      await super.initialize(withWallet, this.chainId);
    } else {
      await super.initialize(withWallet);
    }
    this.namespaceFactory = new NamespaceFactory(
      this.namespaceFactoryAddress,
      this.rpc,
    );
    await this.namespaceFactory.initialize();
  }

  /**
   * Gets Buy price details of an address x id stake, prices converted from wei
   * @param name namespace name
   * @param id id of community stake
   * @param amount amount to buy
   * @returns price, fees, totalPrice
   */
  async getBuyPrice(
    name: string,
    id: number,
    amount: number,
  ): Promise<PriceData> {
    if (!this.initialized) {
      await this.initialize();
    }
    const namespaceAddress = await this.getNamespaceAddress(name);
    const calldata = `0xf1220bbf${this.web3.eth.abi
      .encodeParameters(
        ['address', 'uint256', 'uint256'],
        [namespaceAddress, id, amount],
      )
      .substring(2)}`;
    const result = await this.web3.eth.call({
      to: this.contractAddress,
      data: calldata,
    });
    const totalPrice = toBigInt(
      // @ts-expect-error StrictNullChecks
      this.web3.eth.abi.decodeParameter('uint256', result).toString(),
    );
    const feeFreePrice = toBigInt(
      await this.contract.methods
        .getBuyPrice(namespaceAddress, id, amount)
        .call(),
    );
    return {
      price: this.web3.utils.fromWei(feeFreePrice, 'ether'),
      fees: this.web3.utils.fromWei(totalPrice - feeFreePrice, 'ether'),
      totalPrice: this.web3.utils.fromWei(totalPrice, 'ether'),
    };
  }

  /**
   * Gets sell price(proceeds) details of an address x id stake. Prices converted from wei
   * @param name namespace name
   * @param id id of community stake
   * @param amount amount to sell
   * @returns price, fees, totalPrice
   */
  async getSellPrice(
    name: string,
    id: number,
    amount: number,
  ): Promise<PriceData> {
    if (!this.initialized) {
      await this.initialize();
    }
    const namespaceAddress = await this.getNamespaceAddress(name);
    const totalPrice = toBigInt(
      await this.contract.methods
        .getSellPriceAfterFee(namespaceAddress, id, amount)
        .call(),
    );
    const feeFreePrice = toBigInt(
      await this.contract.methods
        .getSellPrice(namespaceAddress, id, amount)
        .call(),
    );
    return {
      price: this.web3.utils.fromWei(feeFreePrice, 'ether'),
      fees: this.web3.utils.fromWei(totalPrice - feeFreePrice, 'ether'),
      totalPrice: this.web3.utils.fromWei(totalPrice, 'ether'),
    };
  }

  /**
   * Buy Community Stake, recalculates total buy as CS does not allow slippage
   * @param name namespace name
   * @param id id of community stake
   * @param amount amount to buy
   * @param walletAddress an active evm wallet addresss to send tx from
   * @returns txReceipt
   */
  async buyStake(
    name: string,
    id: number,
    amount: number,
    walletAddress: string,
  ): Promise<any> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    const namespaceAddress = await this.getNamespaceAddress(name);

    // Create a specific Web3 instance just for this call
    const specificWeb3 = new Web3(this.rpc);

    const calldata = `0xf1220bbf${specificWeb3.eth.abi
      .encodeParameters(
        ['address', 'uint256', 'uint256'],
        [namespaceAddress, id.toString(), amount.toString()],
      )
      .substring(2)}`;
    const result = await specificWeb3.eth.call({
      to: this.contractAddress,
      data: calldata,
    });
    const totalPrice = (
      specificWeb3.eth.abi.decodeParameter('uint256', result) as bigint | number
    ).toString();

    const maxFeePerGasEst = await this.estimateGas();
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .buyStake(namespaceAddress, id, amount)
        .send({
          value: totalPrice,
          from: walletAddress,
          type: '0x2',
          maxFeePerGas: maxFeePerGasEst?.toString(),
          maxPriorityFeePerGas: this.web3.utils.toWei('0.001', 'gwei'),
        });
      try {
        // @ts-expect-error StrictNullChecks
        await this.web3.currentProvider.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC1155',
            options: {
              address: namespaceAddress,
              tokenId: id.toString(),
            },
          },
        });
      } catch (error) {
        console.log('Failed to watch asset in MM, watch manaually', error);
      }
    } catch {
      throw new Error('Transaction failed');
    }
    return txReceipt;
  }

  /**
   * Sell Community Stake
   * @param name namespace name
   * @param id id of community stake
   * @param amount amount to sell
   * @param walletAddress an active evm wallet addresss to send tx from
   */
  async sellStake(
    name: string,
    id: number,
    amount: number,
    walletAddress: string,
  ): Promise<any> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }

    const namespaceAddress = await this.getNamespaceAddress(name);
    const maxFeePerGasEst = await this.estimateGas();
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .sellStake(namespaceAddress, id.toString(), amount.toString())
        .send({
          from: walletAddress,
          type: '0x2',
          maxFeePerGas: maxFeePerGasEst?.toString(),
          maxPriorityFeePerGas: this.web3.utils.toWei('0.001', 'gwei'),
        });
    } catch {
      throw new Error('Transaction failed');
    }
    return txReceipt;
  }

  /**
   * Get balance of a users community stake
   * @param name namespace name
   * @param id id of community stake
   * @param walletAddress wallet address to get balance for
   * @returns user balance
   */
  async getUserStakeBalance(
    name: string,
    id: number,
    walletAddress: string,
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    const namespaceAddress = await this.getNamespaceAddress(name);
    const calldata = `0x00fdd58e${this.web3.eth.abi
      .encodeParameters(['address', 'uint256'], [walletAddress, id])
      .substring(2)}`;
    const result = await this.web3.eth.call({
      to: namespaceAddress,
      data: calldata,
    });
    // @ts-expect-error StrictNullChecks
    return this.web3.eth.abi.decodeParameter('uint256', result).toString();
  }

  /**
   * get total supply of an Id
   * @param name namespace name
   * @param id id of the token
   * @returns total supply
   */
  async getUserIdSupply(name: string, id: number): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    const namespaceAddress = await this.getNamespaceAddress(name);
    const calldata = `0x5a9807be${this.web3.eth.abi
      .encodeParameters(['uint256'], [id])
      .substring(2)}`;
    const result = await this.web3.eth.call({
      to: namespaceAddress,
      data: calldata,
    });
    // @ts-expect-error StrictNullChecks
    return this.web3.eth.abi.decodeParameter('uint256', result).toString();
  }

  /**
   * gets address for a namespace name, caches until next new name
   * @param name namespace name
   * @returns
   */
  async getNamespaceAddress(name: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    if (
      this.addressCache.name !== name ||
      this.addressCache.address === '0x0'
    ) {
      this.addressCache.address =
        await this.namespaceFactory.getNamespaceAddress(name);
      this.addressCache.name = name;
    }
    return this.addressCache.address;
  }

  /**
   * gets current users balance and converts to ETH value
   * @param walletAddress user wallet address
   * @returns string balance in ETH
   */
  async getUserEthBalance(walletAddress: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    const balance = await this.web3.eth.getBalance(walletAddress);
    return this.web3.utils.fromWei(balance, 'ether');
  }
}

export default CommunityStakes;
