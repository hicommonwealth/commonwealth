import { AbiItem } from 'web3-utils';
import { namespaceFactoryAbi } from './Abi/NamespaceFactoryAbi';
import { reservationHookAbi } from './Abi/ReservationHookAbi';
import ContractBase from './ContractBase';

/**
 * Abstract contract helpers for the Namespace Factory contract
 */
class NamespaceFactory extends ContractBase {
  public reservationHook: any;

  /*
   * Initializes a namespace instance at factory address
   * @param factoryAddress the address of the active factory to use
   */
  constructor(factoryAddress: string) {
    super(factoryAddress, namespaceFactoryAbi);
  }

  /**
   * Initializes wallet and contracts.
   * This must be called after instantiation before other methods are available.
   */
  async initialize(): Promise<void> {
    await super.initialize();
    const addr = await this.contract.methods.reservationHook().call();
    if (addr.toLowerCase() !== '0x0000000000000000000000000000000000000000') {
      this.reservationHook = new this.web3.eth.Contract(
        reservationHookAbi as AbiItem[],
        addr,
      );
    }
  }

  /**
   * Gets the contract address for a namespace with the given name
   * @param name Namespace name
   * @returns contract address 0x...
   */
  async getNamespaceAddress(name: string): Promise<string> {
    this.isInitialized();
    const hexString = this.web3.utils.utf8ToHex(name);
    const activeNamespace = await this.contract.methods
      .getNamespace(hexString)
      .call();
    return activeNamespace;
  }

  /**
   * Checks if namespace is reserved both in existing names and at
   * reservation hook
   * @param name Namespace name
   * @returns Boolean: true when namespace is available, otherwise false
   */
  async checkNamespaceReservation(name: string): Promise<boolean> {
    this.isInitialized();
    const activeNamespace = await this.getNamespaceAddress(name);
    if (activeNamespace !== '0x0000000000000000000000000000000000000000') {
      return false;
    }
    if (this.reservationHook) {
      return await this.reservationHook.methods
        .validateReservationStatus(this.wallet.accounts[0], name, '')
        .call();
    }
    return true;
  }

  /**
   * Deploys a new namespace. Note current wallet will be admin of namespace
   * @param name New Namespace name
   * @param feeManager wallet or contract address to send community fees
   * @returns txReceipt or Error if name is taken or tx fails
   */
  async deployNamespace(name: string, feeManager: string): Promise<any> {
    this.isInitialized();
    // Check if name is available
    const namespaceStatus = await this.checkNamespaceReservation(name);
    if (!namespaceStatus) {
      throw new Error('Namespace already reserved');
    }

    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .deployNamespace(name, feeManager, [])
        .send({ from: this.wallet.accounts[0] });
    } catch (error) {
      throw new Error('Transaction failed: ' + error);
    }

    return txReceipt;
  }

  /**
   * Configures a community stakes id on the given namespace
   * Note: current wallet address must be an admin on the namespace specified
   * @param name Namespace name
   * @param stakesId the id on the namespace to use for stake
   * @returns tx receipt or failure message
   */
  async configureCommunityStakes(name: string, stakesId: number): Promise<any> {
    this.isInitialized();
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .configureCommunityStakesId(name, name + ' Community Stake', stakesId)
        .send({ from: this.wallet.accounts[0] });
    } catch {
      throw new Error('Transaction failed');
    }
    return txReceipt;
  }
}

export default NamespaceFactory;
