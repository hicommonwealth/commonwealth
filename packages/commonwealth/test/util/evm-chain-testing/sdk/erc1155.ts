import axios from 'axios';
import { erc1155Mint } from '../src/types';

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
    const request: erc1155Mint = {
      contractAddress: this.address,
      tokenId,
      to,
      amount,
    };
    const response = await axios.post(
      `${this.host}/erc1155/mint`,
      JSON.stringify(request),
      this.header,
    );
    this.activeTokenIds.push(tokenId);
    return response.data;
  }
}
