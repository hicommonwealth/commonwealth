import { ERC20Token } from 'adapters/chain/ethereum/types';
import { ERC20, ERC20__factory } from 'eth/types';
import ContractApi from 'controllers/chain/ethereum/contractApi';
import Ethereum from 'controllers/chain/ethereum/main';

import { NodeInfo, ITokenAdapter } from 'models';
import { IApp } from 'state';
import BN from 'bn.js';

class TokenApi extends ContractApi<ERC20> {}

export default class Token extends Ethereum implements ITokenAdapter {
  // required implementations for ITokenAdapter
  public readonly contractAddress: string;
  public contractApi: TokenApi;
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
    const balance = new ERC20Token(
      this.contractAddress,
      new BN(balanceBN.toString(), 10)
    );
    this.hasToken = balance && !balance.isZero();
    if (balance) this.tokenBalance = balance;
    return this.hasToken;
  }

  // Extensions of Ethereum
  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.contractAddress = meta.address;
  }

  public async initApi() {
    await super.initApi();
    const api = new TokenApi(
      ERC20__factory.connect,
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
