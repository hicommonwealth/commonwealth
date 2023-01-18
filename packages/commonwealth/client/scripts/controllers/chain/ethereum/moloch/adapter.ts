import type { EthereumCoin } from 'adapters/chain/ethereum/types';
import { Moloch1__factory } from 'common-common/src/eth/types';
import { ChainBase, ContractType } from 'common-common/src/types';

import type EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import type { ChainInfo } from 'models';
import { IChainAdapter } from 'models';
import type { IApp } from 'state';
import MolochAPI from './api';

import MolochChain from './chain';
import MolochGovernance from './governance';
import MolochMembers from './members';

export default class Moloch extends IChainAdapter<
  EthereumCoin,
  EthereumAccount
> {
  public readonly base = ChainBase.Ethereum;
  public chain: MolochChain;
  public ethAccounts: EthereumAccounts;
  public accounts: MolochMembers;
  public governance: MolochGovernance;

  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.chain = new MolochChain(this.app);
    this.ethAccounts = new EthereumAccounts(this.app);
    this.accounts = new MolochMembers(this.app, this.chain, this.ethAccounts);
    this.governance = new MolochGovernance(this.app);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.ethAccounts.init(this.chain);
    const molContracts = this.app.contracts.getByType(ContractType.MOLOCH1);
    if (!molContracts || !molContracts.length) {
      throw new Error('No Mol contracts found');
    }
    const molContract = molContracts[0];
    const api = new MolochAPI(
      Moloch1__factory.connect,
      molContract.address,
      this.chain.api.currentProvider as any
    );
    await api.init();
    this.chain.molochApi = api;
    await this.accounts.init(api);
    await super.initApi();
  }

  public async initData() {
    await this.chain.initEventLoop();
    await this.governance.init(this.chain, this.accounts);
    await super.initData();
  }

  public async deinit() {
    await super.deinit();
    this.governance.deinit();
    this.ethAccounts.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    await this.chain.deinitApi();
    console.log('Ethereum/Moloch stopped.');
  }
}
