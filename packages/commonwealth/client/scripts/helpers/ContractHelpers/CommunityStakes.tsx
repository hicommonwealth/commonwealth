import ContractBase from './ContractBase';
import NamespaceFactory from './NamspaceFactory';

export type PriceData = {
  price: string;
  fees: string;
  totalPrice: string;
};

class CommunityStakes extends ContractBase {
  namespaceFactory: NamespaceFactory;
  addressCache = { address: '0x0', name: '' };

  constructor(contractAddress: string, factoryAddress: string) {
    super(contractAddress, []);
    this.namespaceFactory = new NamespaceFactory(factoryAddress);
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
    const namespaceAddress = await this.getNamespaceAddress(name);
    const totalPrice = this.toBN(
      await this.contract.methods
        .getBuyPriceAfterFee(namespaceAddress, id, amount)
        .call(),
    );
    const feeFreePrice = this.toBN(
      await this.contract.methods
        .getBuyPrice(namespaceAddress, id, amount)
        .call(),
    );
    return {
      price: feeFreePrice.div(this.toBN(1e18)).toString(),
      fees: totalPrice.sub(feeFreePrice).div(this.toBN(1e18)).toString(),
      totalPrice: totalPrice.div(this.toBN(1e18)).toString(),
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
    const namespaceAddress = await this.getNamespaceAddress(name);
    const totalPrice = this.toBN(
      await this.contract.methods
        .getSellPriceAfterFee(namespaceAddress, id, amount)
        .call(),
    );
    const feeFreePrice = this.toBN(
      await this.contract.methods
        .getSellPrice(namespaceAddress, id, amount)
        .call(),
    );
    return {
      price: feeFreePrice.div(this.toBN(1e18)).toString(),
      fees: totalPrice.sub(feeFreePrice).div(this.toBN(1e18)).toString(),
      totalPrice: totalPrice.div(this.toBN(1e18)).toString(),
    };
  }

  /**
   * Buy Community Stake, recalculates total buy as CS does not allow slippage
   * @param name namespace name
   * @param id id of community stake
   * @param amount amount to buy
   * @returns txReceipt
   */
  async buyStake(name: string, id: number, amount: number): Promise<any> {
    const namespaceAddress = await this.getNamespaceAddress(name);
    const totalPrice = await this.contract.methods
      .getBuyPriceAfterFee(namespaceAddress, id, amount)
      .call();
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .buyStake(namespaceAddress, id, amount)
        .send({ value: totalPrice, from: this.wallet.accounts[0] });
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
   */
  async sellStake(name: string, id: number, amount: number): Promise<any> {
    const namespaceAddress = await this.getNamespaceAddress(name);
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .sellStake(namespaceAddress, id, amount)
        .send({ from: this.wallet.accounts[0] });
    } catch {
      throw new Error('Transaction failed');
    }
    return txReceipt;
  }

  /**
   * Get balance of a users community stake
   * @param name namespace name
   * @param id id of community stake
   * @returns user balance
   */
  async getUserStakeBalance(name: string, id: number): Promise<string> {
    const namespaceAddress = await this.getNamespaceAddress(name);
    const calldata = `0x8f32d59b${this.web3.eth.abi
      .encodeParameters(['address', 'uint256'], [this.wallet.accounts[0], id])
      .substring(2)}`;
    const result = await this.web3.eth.call({
      to: namespaceAddress,
      data: calldata,
    });
    return this.web3.eth.abi.decodeParameter('uint256', result).toString();
  }

  /**
   * get total supply of an Id
   * @param name namespace name
   * @param id id of the token
   * @returns total supply
   */
  async getUserIdSupply(name: string, id: number): Promise<string> {
    const namespaceAddress = await this.getNamespaceAddress(name);
    const calldata = `0x5a9807be${this.web3.eth.abi
      .encodeParameters(['uint256'], [this.wallet.accounts[0], id])
      .substring(2)}`;
    const result = await this.web3.eth.call({
      to: namespaceAddress,
      data: calldata,
    });
    return this.web3.eth.abi.decodeParameter('uint256', result).toString();
  }

  /**
   * gets address for a namespace name, caches until next new name
   * @param name namespace name
   * @returns
   */
  async getNamespaceAddress(name: string): Promise<string> {
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
}

export default CommunityStakes;
