import { ERC721Token } from 'adapters/chain/ethereum/types';

import BN from 'bn.js';
import type { ERC721 } from 'common-common/src/eth/types';
import { ERC721__factory } from 'common-common/src/eth/types';
import { ContractType } from 'common-common/src/types';
import Ethereum from 'controllers/chain/ethereum/adapter';
import ContractApi from 'controllers/chain/ethereum/contractApi';
import type { IApp } from 'state';
import type ChainInfo from '../../../models/ChainInfo';
import type ITokenAdapter from '../../../models/ITokenAdapter';

class NftApi extends ContractApi<ERC721> {}

export default class Nft extends Ethereum implements ITokenAdapter {
  // required implementations for ITokenAdapter
  public contractAddress: string;
  public contractApi: NftApi;
  public hasToken = false;
  public tokenBalance: BN = new BN(0);

  public async activeAddressHasToken(activeAddress?: string): Promise<boolean> {
    if (!activeAddress || !this.contractApi?.Contract) return false;
    this.hasToken = false;
    const account = this.accounts.get(activeAddress);

    // query balance
    const balanceBN = await this.contractApi.Contract.balanceOf(
      account.address
    );
    const balance = new ERC721Token(
      this.contractAddress,
      new BN(balanceBN.toString(), 10)
    );
    this.hasToken = balance && !balance.isZero();
    if (balance) this.tokenBalance = balance;
    return this.hasToken;
  }

  // Extensions of Ethereum
  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
  }

  public async initApi() {
    // iterate through selectedChain.Contracts for the Nft type and return the address
    const nftContracts = this.app.contracts.getByType(ContractType.ERC721);
    if (!nftContracts || !nftContracts.length) {
      throw new Error('No ERC721 contracts found');
    }
    const nftContract = nftContracts[0];
    this.contractAddress = nftContract.address;

    await super.initApi();

    // Initialize contract API
    const api = new NftApi(
      ERC721__factory.connect,
      this.contractAddress,
      this.chain.api.currentProvider as any
    );

    await api.init();
    this.contractApi = api;
  }

  public async initData() {
    await super.initData();
  }
}
