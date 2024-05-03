import Web3, { AbiFragment, Contract } from 'web3';
import { erc_721 } from '../utils/contracts';
import getProvider from '../utils/getProvider';

export class ERC721 {
  public address: string;
  public host: string;
  public header: any;
  public contract: Contract<AbiFragment[]>;
  private readonly provider: Web3;
  private accounts: string[] | undefined;

  /**
   *
   * @param host chain testing host
   * @param header axios header
   * @param address address of deployed NFT
   */
  constructor(host: string, header: any, address: string) {
    this.host = host;
    this.header = header;
    this.address = address;

    this.provider = getProvider();
    this.contract = erc_721(this.address, this.provider);
  }

  private async getAccounts() {
    if (!this.accounts) {
      this.accounts = await this.provider.eth.getAccounts();
    }
    return this.accounts;
  }

  /**
   * mint a new id for this nft
   * @param tokenId new token id to mint (any number as a string)
   * @param to Account index to mint to
   * @returns
   */
  public async mint(tokenId: string, to: number) {
    const accounts = await this.getAccounts();
    const txReceipt = await this.contract.methods
      .safeMint(accounts[to], tokenId)
      .send({
        from: accounts[0],
        gas: '500000',
      });
    return { block: Number(txReceipt.blockNumber) };
  }

  public async burn(tokenId: string) {
    const accounts = await this.getAccounts();
    const txReceipt = await this.contract.methods
      .burn(tokenId)
      .send({ from: accounts[0], gas: '500000' });
    return { block: Number(txReceipt.blockNumber) };
  }

  /**
   * Transfer a specific ERC721 token ID
   * @param tokenId NFT token ID
   * @param to transfer to(acct idx)
   * @param from transfer from: optional if using acct Index
   * @param accountIndex transfer from: optional if using from
   */
  public async transferERC721(
    tokenId: string,
    to: number,
    from?: string,
    accountIndex?: number,
  ): Promise<{ block: number }> {
    const accounts = await this.getAccounts();
    const account = accountIndex ? accounts[accountIndex] : from;
    const txReceipt = await this.contract.methods
      .safeTransferFrom(account, accounts[to], tokenId)
      .send({ from: accounts[0], gas: '500000' });
    return { block: Number(txReceipt.blockNumber) };
  }

  /**
   * Approve a single ERC721 for use
   * @param tokenId NFT token ID
   * @param to the operator to approve to(acct index)
   * @param from from acct(owner): optional if using acct Index
   * @param accountIndex from acct index(owner): optional if using from
   */
  public async approveERC721(
    tokenId: string,
    to: number,
    from?: string,
    accountIndex?: number,
    all?: boolean,
  ): Promise<{ block: number }> {
    const accounts = await this.getAccounts();
    const account = accountIndex ? accounts[accountIndex] : from;

    if (all) {
      const txReceipt = await this.contract.methods
        .setApprovalForAll(accounts[to], true)
        .send({ from: account, gas: '500000' });
      return { block: Number(txReceipt.blockNumber) };
    }

    const txReceipt = await this.contract.methods
      .approve(accounts[to], tokenId)
      .send({ from: account, gas: '500000' });
    return { block: Number(txReceipt.blockNumber) };
  }
}
