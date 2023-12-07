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
    this.contract.methods
      .reservationHook()
      .call()
      .then((addr) => {
        if (
          addr.toLowerCase() !== '0x0000000000000000000000000000000000000000'
        ) {
          this.reservationHook = new this.web3.eth.Contract(
            reservationHookAbi as AbiItem[],
            addr,
          );
        }
      });
  }

  /**
   * Gets the contract address for a namespace with the given name
   * @param name Namespace name
   * @returns contract address 0x...
   */
  async getNamespaceAddress(name: string): Promise<string> {
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
   * @returns contract address 0x...
   */
  async checkNamespaceReservation(name: string): Promise<boolean> {
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
    // Check if name is available
    const namespaceStatus = await this.checkNamespaceReservation(name);
    if (!namespaceStatus) {
      throw new Error('Namespace already reserved');
    }

    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .deployNamespace(name, feeManager, '')
        .send({ from: this.wallet.accounts[0] });
    } catch {
      throw new Error('Transaction failed');
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
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .configureCommunityStakeId(
          name,
          name.concat(' Community Stake'),
          stakesId,
        )
        .send({ from: this.wallet.accounts[0] });
    } catch {
      throw new Error('Transaction failed');
    }
    return txReceipt;
  }
}

export default NamespaceFactory;
