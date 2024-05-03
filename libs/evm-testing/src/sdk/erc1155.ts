import { erc_1155 } from '../utils/contracts';
import getProvider from '../utils/getProvider';

export class ERC1155 {
  public address: string;
  public host: string;
  public header: any;
  public activeTokenIds: string[] = [];

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
  }

  public async mint(tokenId: string, amount: number, to: string) {
    const provider = getProvider();
    const contract = erc_1155(this.address, provider);
    const accounts = await provider.eth.getAccounts();

    const tx = contract.methods.mint(to, Number(tokenId), amount);
    const txReceipt = await tx.send({ from: accounts[0], gas: '500000' });
    return { block: Number(txReceipt.blockNumber) };
  }
}
