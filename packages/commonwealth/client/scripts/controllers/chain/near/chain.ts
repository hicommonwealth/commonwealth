import { NearToken } from 'adapters/chain/near/types';
import BN from 'bn.js';
import { uuidv4 } from 'lib/util';
import { _DEPRECATED_dangerouslySetRoute, redraw } from 'mithrilInterop';
import moment from 'moment';
import type { ConnectConfig, Near as NearApi } from 'near-api-js';
import { Account as NearApiAccount, connect as nearConnect, WalletAccount, } from 'near-api-js';
import type { FunctionCallOptions } from 'near-api-js/lib/account';
import type { CodeResult, NodeStatusResult, } from 'near-api-js/lib/providers/provider';
import type { Action, FunctionCall } from 'near-api-js/lib/transaction';
import type { IApp } from 'state';
import { ApiStatus } from 'state';
import type { IChainModule, ITXModalData } from '../../../models/interfaces';
import type { NearAccount, NearAccounts } from './account';
import type { NearSputnikConfig, NearSputnikPolicy } from './sputnik/types';
import { isGroupRole } from './sputnik/types';

export interface IDaoInfo {
  contractId: string;
  amount: string;
  name: string;
  purpose: string;
  proposalBond: string;
  proposalPeriod: string;
  bountyBond: string;
  bountyPeriod: string;
  council: string[];
}

export type SerializableFunctionCallOptions = Omit<
  FunctionCallOptions,
  'gas' | 'attachedDeposit'
> & {
  gas: string;
  attachedDeposit: string;
  walletCallbackUrl: string;
};

class NearChain implements IChainModule<NearToken, NearAccount> {
  private _api: NearApi;
  public get api(): NearApi {
    return this._api;
  }

  public get denom() {
    return this.app.chain.currency;
  }

  private _decimals: BN;

  public coins(n: number | string | BN, inDollars = false) {
    return new NearToken(n, inDollars, this._decimals);
  }

  private _config: ConnectConfig;
  public get config() {
    return this._config;
  }

  private _chainId: string;
  public get chainId() {
    return this._chainId;
  }

  private _nodeStatus: NodeStatusResult;
  public get nodeStatus(): NodeStatusResult {
    return this._nodeStatus;
  }

  private _networkId = 'testnet';

  public get isMainnet() {
    return this._networkId === 'mainnet';
  }

  private _app: IApp;
  public get app() {
    return this._app;
  }

  constructor(app: IApp) {
    this._app = app;
  }

  public async init(chain: ChainInfo, accounts: NearAccounts): Promise<void> {
    const decimalPlaces = chain.decimals || 24;
    this._decimals = new BN(10).pow(new BN(decimalPlaces));
    const networkSuffix = chain.id.split('.').pop();
    this._networkId =
      chain.id === 'near-testnet' || networkSuffix === 'testnet'
        ? 'testnet'
        : 'mainnet';
    this._config = {
      networkId: this.isMainnet ? 'mainnet' : 'testnet',
      nodeUrl: this.isMainnet
        ? 'https://rpc.mainnet.near.org'
        : 'https://rpc.testnet.near.org',
      walletUrl: this.isMainnet
        ? 'https://wallet.near.org/'
        : 'https://wallet.testnet.near.org/',
      keyStore: accounts.keyStore,
    };

    this._api = await nearConnect(this.config);

    try {
      this._nodeStatus = await this._api.connection.provider.status();

      // handle chain-related updates
      this._chainId = this._nodeStatus.chain_id;
      const { latest_block_time, latest_block_height } =
        this._nodeStatus.sync_info;

      // update block heights and times
      this.app.chain.block.lastTime = moment(latest_block_time);
      this.app.chain.block.height = latest_block_height;
      const prevBlock = await this._api.connection.provider.block(
        latest_block_height - 1
      );
      // TODO: check ms vs seconds here
      this.app.chain.block.duration =
        +latest_block_time - prevBlock.header.timestamp;
      if (this.app.chain.networkStatus !== ApiStatus.Connected) {
        this.app.chain.networkStatus = ApiStatus.Connected;
        redraw();
      }
    } catch (e) {
      if (this.app.chain.networkStatus !== ApiStatus.Disconnected) {
        console.error(`failed to query NEAR status: ${JSON.stringify(e)}`);
        this.app.chain.networkStatus = ApiStatus.Disconnected;
        redraw();
      }
    }
  }

  public async query<T>(
    contractId: string,
    method: string,
    args: Record<string, unknown>
  ): Promise<T> {
    const rawResult = await this.api.connection.provider.query<CodeResult>({
      request_type: 'call_function',
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    });
    const res = JSON.parse(Buffer.from(rawResult.result).toString());
    return res;
  }

  // NOTE: this function requests A LOT of data from the chain and should be used sparingly,
  //  ideally only when loading the DAO list page
  public async viewDaoList(): Promise<IDaoInfo[]> {
    const daoContract = this.isMainnet
      ? 'sputnik-dao.near'
      : 'sputnikv2.testnet';
    const daos: string[] = await this.query(daoContract, 'get_dao_list', {});
    const daoInfos: IDaoInfo[] = await Promise.all(
      daos.map(async (daoId) => {
        try {
          const state = await new NearApiAccount(
            this.api.connection,
            daoId
          ).state();
          const policy: NearSputnikPolicy = await this.query(
            daoId,
            'get_policy',
            {}
          );
          const config: NearSputnikConfig = await this.query(
            daoId,
            'get_config',
            {}
          );
          const council = policy.roles.find((r) => isGroupRole(r.kind));
          // TODO: support diff types of policy roles
          // if (!council) {
          //   console.log(
          //     `No council found in policy for ${daoId}: ${JSON.stringify(
          //       policy.roles
          //     )}`
          //   );
          // }
          return {
            contractId: daoId,
            amount: state.amount,
            name: config.name,
            purpose: config.purpose,
            proposalBond: policy.proposal_bond,
            proposalPeriod: policy.proposal_period,
            bountyBond: policy.bounty_bond,
            bountyPeriod: policy.bounty_forgiveness_period,
            council: (council?.kind as { Group: string[] })?.Group || [],
          };
        } catch (e) {
          // console.error(`Failed to query dao info for ${daoId}: ${e.message}`);
          return null;
        }
      })
    );
    return daoInfos.filter((d) => !!d);
  }

  public async redirectTx(
    contractId: string,
    methodName: string,
    args: Record<string, unknown>,
    attachedDeposit?: string,
    postTxRedirect?: string,
    gas?: string
  ): Promise<void> {
    // construct tx object
    const functionCall: Partial<SerializableFunctionCallOptions> = {
      contractId,
      methodName,
      args,
    };
    if (attachedDeposit) {
      functionCall.attachedDeposit = attachedDeposit;
    }
    if (postTxRedirect) {
      functionCall.walletCallbackUrl = postTxRedirect;
    }
    if (gas) {
      functionCall.gas = gas;
    }

    // generate random identifier as localStorage key
    const uuid = uuidv4();
    localStorage[uuid] = JSON.stringify(functionCall);

    // redirect to generate access key for dao contract
    let redirectUrl;
    if (!this.app.isCustomDomain()) {
      redirectUrl = `${
        window.location.origin
      }/${this.app.activeChainId()}/finishNearLogin`;
    } else {
      redirectUrl = `${window.location.origin}/finishNearLogin`;
    }
    const successUrl = `${redirectUrl}?saved_tx=${uuid}`;
    const failureUrl = `${redirectUrl}?tx_failure=${uuid}`;

    const wallet = new WalletAccount(this.api, 'commonwealth_near');
    let shouldRequestSignIn = true;
    if (wallet.isSignedIn) {
      // check if we can send without requesting a new sign-in
      const accessKey = await wallet
        .account()
        .accessKeyForTransaction(contractId, [
          {
            functionCall: {
              // we only need deposit and methodName here based on implementation of
              // accessKeyForTransaction (which relies on accessKeyMatchesTransaction)
              // so it's okay to leave args unmarshalled
              deposit: new BN(attachedDeposit || 0),
              methodName,
              gas: new BN(gas || 0),
              args: args as any,
            } as FunctionCall,
          } as Action,
        ]);
      console.log(accessKey);
      shouldRequestSignIn = !accessKey;
    }
    if (shouldRequestSignIn) {
      await wallet.requestSignIn({
        contractId,
        methodNames: [methodName],
        successUrl,
        failureUrl,
      });
    } else {
      _DEPRECATED_dangerouslySetRoute(successUrl);
    }
  }

  public async deinit(): Promise<void> {
    this.app.chain.networkStatus = ApiStatus.Disconnected;
  }

  public createTXModalData(): ITXModalData {
    // TODO
    throw new Error('Txs not yet implemented');
  }
}

export default NearChain;
