import {
  namespaceAbi,
  namespaceFactoryAbi,
  reservationHookAbi,
} from '@hicommonwealth/evm-protocols';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { TransactionReceipt } from 'web3';
import { AbiItem } from 'web3-utils';
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
    if (addr.toLowerCase() !== ZERO_ADDRESS) {
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
      .getNamespace(hexString.padEnd(66, '0'))
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
    if (activeNamespace !== ZERO_ADDRESS) {
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
   * @param chainId The id of the EVM chain
   * @returns txReceipt or Error if name is taken or tx fails
   */
  async deployNamespace(
    name: string,
    walletAddress: string,
    feeManager: string,
    chainId: string,
  ): Promise<any> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId);
    }
    // Check if name is available
    const namespaceStatus = await this.checkNamespaceReservation(name);
    if (!namespaceStatus) {
      throw new Error('Namespace already reserved');
    }
    const maxFeePerGasEst = await this.estimateGas();
    let txReceipt;
    try {
      const uri = `${window.location.origin}/api/namespaceMetadata/${name}/{id}`;
      txReceipt = await this.contract.methods
        .deployNamespace(name, uri, feeManager, [])
        .send({
          from: walletAddress,
          type: '0x2',
          maxFeePerGas: maxFeePerGasEst?.toString(),
          maxPriorityFeePerGas: this.web3.utils.toWei('0.001', 'gwei'),
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
    const maxFeePerGasEst = await this.estimateGas();
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .configureCommunityStakeId(
          name,
          name + ' Community Stake',
          stakesId,
          ZERO_ADDRESS,
          2000000,
          0,
        )
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

  async newContest(
    namespaceName: string,
    contestInterval: number,
    winnerShares: number[],
    stakeId: number = 2,
    voterShare: number,
    weight: number = 1,
    walletAddress: string,
    exchangeToken?: string,
    feeShare?: number,
    prizeShare?: number,
  ): Promise<TransactionReceipt> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }
    const maxFeePerGasEst = await this.estimateGas();
    let txReceipt;
    try {
      if (!exchangeToken) {
        txReceipt = await this.contract.methods
          .newContest(
            namespaceName,
            contestInterval,
            winnerShares,
            stakeId,
            prizeShare,
            voterShare,
            feeShare,
            weight,
          )
          .send({
            from: walletAddress,
            type: '0x2',
            maxFeePerGas: maxFeePerGasEst?.toString(),
            maxPriorityFeePerGas: this.web3.utils.toWei('0.001', 'gwei'),
          });
      } else {
        txReceipt = await this.contract.methods
          .newSingleContest(
            namespaceName,
            contestInterval,
            winnerShares,
            stakeId,
            voterShare,
            weight,
            exchangeToken,
          )
          .send({
            from: walletAddress,
            type: '0x2',
            maxFeePerGas: maxFeePerGasEst?.toString(),
            maxPriorityFeePerGas: this.web3.utils.toWei('0.001', 'gwei'),
          });
      }
    } catch {
      throw new Error('Transaction failed');
    }
    return txReceipt;
  }

  async newERC20Contest(
    namespaceName: string,
    contestInterval: number,
    winnerShares: number[],
    voteToken: string,
    voterShare: number,
    walletAddress: string,
    exchangeToken: string,
  ): Promise<TransactionReceipt> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true);
    }
    const maxFeePerGasEst = await this.estimateGas();
    let txReceipt;
    try {
      txReceipt = await this.contract.methods
        .newSingleERC20Contest(
          namespaceName,
          contestInterval,
          winnerShares,
          voteToken,
          voterShare,
          exchangeToken,
        )
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

  async getFeeManagerBalance(
    namespace: string,
    token?: string,
    decimals?: number,
  ): Promise<string> {
    const namespaceAddr = await this.getNamespaceAddress(namespace);
    const namespaceContract = new this.web3.eth.Contract(
      [
        {
          inputs: [],
          stateMutability: 'view',
          type: 'function',
          name: 'feeManager',
          outputs: [
            {
              internalType: 'address',
              name: '',
              type: 'address',
            },
          ],
        },
      ],
      namespaceAddr,
    );
    const feeManager = await namespaceContract.methods.feeManager().call();

    if (!token) {
      const balance = await this.web3.eth.getBalance(String(feeManager));
      return this.web3.utils.fromWei(balance, 'ether');
    } else {
      const calldata =
        '0x70a08231' +
        this.web3.eth.abi
          .encodeParameters(['address'], [feeManager])
          .substring(2);
      const result = await this.web3.eth.call({
        to: token,
        data: calldata,
      });
      const balance: number = Number(
        this.web3.eth.abi.decodeParameter('uint256', result),
      );
      return String(balance / (10 ^ (decimals ?? 18)));
    }
  }
  /**
   * mints namespace tokens to assignee on id with desired balance
   * @param namespace the namespace name
   * @param id the id on the namespace to mint(admin = 0)
   * @param desiredBalance the total desired balance(admin = 1)
   * @param assigneeAddress the address to assign the token to
   * @param chainId the current chainId
   * @param walletAddress The senders wallet address
   * @returns txReceipt
   * NOTE: If address already has > balance no tokens will be minted
   */
  async mintNamespaceTokens(
    namespace: string,
    id: number,
    desiredBalance: number,
    assigneeAddress: string,
    chainId: string,
    walletAddress: string,
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId);
    }
    const namespaceAddr = await this.getNamespaceAddress(namespace);
    const namespaceContract = new this.web3.eth.Contract(
      namespaceAbi,
      namespaceAddr,
    );
    const balance = await namespaceContract.methods
      .balanceOf(assigneeAddress, id)
      .call();
    const balanceDiff = desiredBalance - Number(balance);
    if (balanceDiff > 0) {
      const txReceipt = await namespaceContract.methods
        .mintId(assigneeAddress, id, balanceDiff, '0x')
        .send({ from: walletAddress });
      return txReceipt;
    }
  }
}

export default NamespaceFactory;
