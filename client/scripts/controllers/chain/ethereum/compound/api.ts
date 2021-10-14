import {
  GovernorCompatibilityBravo,
  GovernorCompatibilityBravo__factory,
  GovernorAlpha,
  GovernorAlpha__factory,
  MPond,
  ERC20VotesComp,
  MPond__factory,
  ERC20VotesComp__factory,
} from 'eth/types';
import { Web3Provider, ExternalProvider } from '@ethersproject/providers';
import { utils } from 'ethers';

import ContractApi from 'controllers/chain/ethereum/contractApi';

export default class CompoundAPI implements ContractApi<GovernorAlpha | GovernorCompatibilityBravo> {
  public readonly gasLimit: number = 3000000;

  public readonly contractAddress: string;
  private _Contract: GovernorAlpha | GovernorCompatibilityBravo;
  public get Contract() { return this._Contract; }
  public readonly Provider: Web3Provider;

  private _Token: MPond | ERC20VotesComp | undefined;
  public get Token() { return this._Token; }

  private _isAlpha: boolean;
  private _isTokenMPond: boolean;
  public isGovAlpha(c: GovernorAlpha | GovernorCompatibilityBravo): c is GovernorAlpha {
    return this._isAlpha;
  }
  public isTokenMPond(t: MPond | ERC20VotesComp | undefined): t is MPond {
    return this._isTokenMPond;
  }

  constructor(
    _factory: any,
    contractAddress: string,
    web3Provider: ExternalProvider
  ) {
    this.contractAddress = contractAddress;
    this.Provider = new Web3Provider(web3Provider);
    // 12s minute polling interval (default is 4s)
    this.Provider.pollingInterval = 12000;
  }

  public async init(tokenName: string) {
    // only Alpha has a guardian -- use to distinguish between types of governance contract
    try {
      this._Contract = GovernorAlpha__factory.connect(this.contractAddress, this.Provider);
      await this.Contract.guardian();
      this._isAlpha = true;
      console.log(`Found GovAlpha contract at ${this.Contract.address}`);
    } catch (e) {
      this._isAlpha = false;
      console.log(`Found non-GovAlpha Compound contract at ${this.Contract.address}, using GovernorCompatibilityBravo`);
      this._Contract = GovernorCompatibilityBravo__factory.connect(this.contractAddress, this.Provider);
    }
    // TODO: use `quorumVotes` to distinguish between raw IGovernor and BravoCompat, for later support

    // fetch token and derive token type
    // i.e. "uni" or "MPond" -- should refer to a call
    let tokenAddress: string;

    // `.token()` is the way to fetch the token address on GovBravo/related contracts,
    // but since we have no guarantee we're on Bravo, we do it manually via the below ABI hack
    if (!tokenName) {
      tokenName = 'token';
    }

    // attempt to query token via a provided function call name
    try {
      // ABI hack to call arbitrarily named functions on GovAlpha contracts
      const ABI = [
        {
          'inputs': [],
          'name': tokenName,
          'outputs': [
            {
              'name': '',
              'type': 'address'
            }
          ],
          'stateMutability': 'view',
          'type': 'function'
        }
      ];
      const iface = new utils.Interface(JSON.stringify(ABI));
      const data = iface.encodeFunctionData(tokenName);
      const resultData = await this.Contract.provider.call({ to: this.Contract.address, data });
      tokenAddress = utils.getAddress(Buffer.from(utils.stripZeros(resultData)).toString('hex'));
    } catch (err) {
      console.error(`Could not fetch token ${tokenName}: ${err.message}`);
      return
    }

    // query token and determine token capabilities (MPond vs ERC20VotesComp)
    if (tokenAddress) {
      this._Token = MPond__factory.connect(tokenAddress, this.Contract.signer || this.Contract.provider);
      try {
        await this._Token.admin();
        this._isTokenMPond = true;
        console.log(`Found MPond-like Comp token at ${tokenAddress}`);
      } catch (e) {
        this._isTokenMPond = false;
        console.log(`Found non-MPond Comp token at ${tokenAddress}, using ERC20VotesComp`);
        this._Token = ERC20VotesComp__factory.connect(tokenAddress, this.Contract.signer || this.Contract.provider);
      }
    } else {
      console.warn('No token contract found! Continuing...');
    }
  }
}
