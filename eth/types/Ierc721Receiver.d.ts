/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, ContractTransaction, EventFilter, Signer } from "ethers";
import { Listener, Provider } from "ethers/providers";
import { Arrayish, BigNumber, BigNumberish, Interface } from "ethers/utils";
import {
  TransactionOverrides,
  TypedEventDescription,
  TypedFunctionDescription
} from ".";

interface Ierc721ReceiverInterface extends Interface {
  functions: {
    onERC721Received: TypedFunctionDescription<{
      encode([operator, from, tokenId, data]: [
        string,
        string,
        BigNumberish,
        Arrayish
      ]): string;
    }>;
  };

  events: {};
}

export class Ierc721Receiver extends Contract {
  connect(signerOrProvider: Signer | Provider | string): Ierc721Receiver;
  attach(addressOrName: string): Ierc721Receiver;
  deployed(): Promise<Ierc721Receiver>;

  on(event: EventFilter | string, listener: Listener): Ierc721Receiver;
  once(event: EventFilter | string, listener: Listener): Ierc721Receiver;
  addListener(
    eventName: EventFilter | string,
    listener: Listener
  ): Ierc721Receiver;
  removeAllListeners(eventName: EventFilter | string): Ierc721Receiver;
  removeListener(eventName: any, listener: Listener): Ierc721Receiver;

  interface: Ierc721ReceiverInterface;

  functions: {
    /**
     * The ERC721 smart contract calls this function on the recipient after a {IERC721-safeTransferFrom}. This function MUST return the function selector, otherwise the caller will revert the transaction. The selector to be returned can be obtained as `this.onERC721Received.selector`. This function MAY throw to revert and reject the transfer. Note: the ERC721 contract address is always the message sender.
     * Handle the receipt of an NFT
     * @param data Additional data with no specified format
     * @param from The address which previously owned the token
     * @param operator The address which called `safeTransferFrom` function
     * @param tokenId The NFT identifier which is being transferred
     * @returns bytes4 `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
     */
    onERC721Received(
      operator: string,
      from: string,
      tokenId: BigNumberish,
      data: Arrayish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;
  };

  /**
   * The ERC721 smart contract calls this function on the recipient after a {IERC721-safeTransferFrom}. This function MUST return the function selector, otherwise the caller will revert the transaction. The selector to be returned can be obtained as `this.onERC721Received.selector`. This function MAY throw to revert and reject the transfer. Note: the ERC721 contract address is always the message sender.
   * Handle the receipt of an NFT
   * @param data Additional data with no specified format
   * @param from The address which previously owned the token
   * @param operator The address which called `safeTransferFrom` function
   * @param tokenId The NFT identifier which is being transferred
   * @returns bytes4 `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
   */
  onERC721Received(
    operator: string,
    from: string,
    tokenId: BigNumberish,
    data: Arrayish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  filters: {};

  estimate: {
    onERC721Received(
      operator: string,
      from: string,
      tokenId: BigNumberish,
      data: Arrayish
    ): Promise<BigNumber>;
  };
}
