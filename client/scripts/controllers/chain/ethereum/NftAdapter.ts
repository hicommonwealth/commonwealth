import { ERC721Token } from 'adapters/chain/ethereum/types';
import { ERC721, ERC721__factory } from 'eth/types';
import ContractApi from 'controllers/chain/ethereum/commonwealth/contractApi';
import Ethereum from 'controllers/chain/ethereum/main';

import { NodeInfo, ITokenAdapter, ChainInfo } from 'models';
import { IApp } from 'state';
import BN from 'bn.js';

class NftApi extends ContractApi<ERC721> {}

export default class Nft extends Ethereum implements ITokenAdapter {
  // required implementations for ITokenAdapter
  public readonly contractAddress: string;
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
    this.contractAddress = meta.address;
  }

  public async initApi() {
    await super.initApi();
    const api = new NftApi(
      ERC721__factory.connect,
      this.meta.address,
      this.chain.api.currentProvider as any
    );
    await api.init();
    this.contractApi = api;
  }

  public async initData() {
    await super.initData();
    await this.activeAddressHasToken(this.app.user?.activeAccount?.address);
  }
}
