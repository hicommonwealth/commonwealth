import { String } from 'aws-sdk/clients/apigateway';
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
  constructor(factoryAddress: string, rpc: string) {
    super(factoryAddress, namespaceFactoryAbi, rpc);
  }

  /**
   * Initializes wallet and contracts.
   * This must be called after instantiation before other methods are available.
   */
  async initialize(
    withWallet: boolean = false,
    chainId?: string,
  ): Promise<void> {
    await super.initialize(withWallet, chainId);
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
    if (!this.initialized) {
      await this.initialize();
    }
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
    if (!this.initialized) {
      await this.initialize();
    }
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
   * @param walletAddress an active evm wallet addresss to send tx from
   * @param feeManager wallet or contract address to send community fees
   * @returns txReceipt or Error if name is taken or tx fails
   */
  async deployNamespace(
    name: string,
    walletAddress: string,
    feeManager: string,
    chainId: String,
  ): Promise<any> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId);
    }
    // Check if name is available
    const namespaceStatus = await this.checkNamespaceReservation(name);
    if (!namespaceStatus) {
      throw new Error('Namespace already reserved');
    }

    let txReceipt;
    try {
      const uri = `${window.location.origin}/api/namespaceMetadata/${name}/{id}`;
      txReceipt = await this.contract.methods
        .deployNamespace(name, uri, feeManager, [])
        .send({
          from: walletAddress,
          maxPriorityFeePerGas: null,
          maxFeePerGas: null,
        });
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
   * @param walletAddress an active evm wallet addresss to send tx from
   * @returns tx receipt or failure message
   */
  async configureCommunityStakes(
    name: string,
    stakesId: number,
    walletAddress: string,
    chainId: string,
  ): Promise<any> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId);
    }

    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .configureCommunityStakeId(
          name,
          name + ' Community Stake',
          stakesId,
          '0x0000000000000000000000000000000000000000',
          100000000,
          0,
        )
        .send({
          from: walletAddress,
          maxPriorityFeePerGas: null,
          maxFeePerGas: null,
        });
    } catch {
      throw new Error('Transaction failed');
    }
    return txReceipt;
  }
}

export default NamespaceFactory;
