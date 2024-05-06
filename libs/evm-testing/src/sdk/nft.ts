import axios from 'axios';
import { erc721Approve, erc721MintBurn } from '../types';

export class ERC721 {
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

  /**
   * mint a new id for this nft
   * @param tokenId new token id to mint (any number as a string)
   * @param to Account index to mint to
   * @returns
   */
  public async mint(tokenId: string, to: number) {
    const request: erc721MintBurn = {
      nftAddress: this.address,
      tokenId,
      to,
      mint: true,
    };
    const response = await axios.post(
      `${this.host}/erc721/mintBurn`,
      JSON.stringify(request),
      this.header,
    );
    this.activeTokenIds.push(tokenId);
    return response.data;
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
    const request: erc721Approve = {
      nftAddress: this.address,
      tokenId,
      to,
      from,
      accountIndex,
    };
    const response = await axios.post(
      `${this.host}/erc721/transfer`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
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
  ): Promise<{ block: number }> {
    const request: erc721Approve = {
      nftAddress: this.address,
      tokenId,
      to,
      from,
      accountIndex,
      all: false,
    };
    const response = await axios.post(
      `${this.host}/erc721/approve`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  /**
   * Approve all holdings for use
   * @param tokenId NFT token ID
   * @param to the operator to approve to acct idx
   * @param from from acct(owner): optional if using acct Index
   * @param accountIndex from acct index(owner): optional if using from
   */
  public async approveAllERC721(
    tokenId: string,
    to: number,
    from?: string,
    accountIndex?: number,
  ) {
    const request: erc721Approve = {
      nftAddress: this.address,
      tokenId,
      to,
      from,
      accountIndex,
      all: true,
    };
    const response = await axios.post(
      `${this.host}/erc721/approve`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }
}
