import type { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import type {
  ERC20VotesComp,
  GovernorAlpha,
  GovernorCompatibilityBravo,
  GovernorCountingSimple,
  MPond,
} from 'common-common/src/eth/types';
import {
  ERC20VotesComp__factory,
  GovernorAlpha__factory,
  GovernorCompatibilityBravo__factory,
  GovernorCountingSimple__factory,
  MPond__factory,
} from 'common-common/src/eth/types';

import type ContractApi from 'controllers/chain/ethereum/contractApi';
import { utils } from 'ethers';

export enum GovernorType {
  Alpha,
  Bravo,
  Oz,
}

export enum GovernorTokenType {
  MPondToken,
  Comp,
  OzVotes,
}

export default class CompoundAPI
  implements
    ContractApi<
      GovernorAlpha | GovernorCompatibilityBravo | GovernorCountingSimple
    >
{
  public readonly gasLimit: number = 3000000;

  public readonly contractAddress: string;
  private _Contract:
    | GovernorAlpha
    | GovernorCompatibilityBravo
    | GovernorCountingSimple;
  private web3Provider: ExternalProvider;
  public get Contract() {
    return this._Contract;
  }

  public Provider: Web3Provider;

  private _tokenType: GovernorTokenType;
  public get tokenType() {
    return this._tokenType;
  }

  private _Token: MPond | ERC20VotesComp | undefined;
  public get Token() {
    return this._Token;
  }

  private _govType: GovernorType;
  public get govType() {
    return this._govType;
  }

  public isGovAlpha(
    c: GovernorAlpha | GovernorCompatibilityBravo | GovernorCountingSimple,
  ): c is GovernorAlpha {
    return this._govType === GovernorType.Alpha;
  }

  public isTokenMPond(t: MPond | ERC20VotesComp | undefined): t is MPond {
    return this._tokenType === GovernorTokenType.MPondToken;
  }

  constructor(contractAddress: string, web3Provider: ExternalProvider) {
    this.contractAddress = contractAddress;
    this.web3Provider = web3Provider;
  }

  public async init(tokenName: string): Promise<void> {
    const { Web3Provider } = await import('@ethersproject/providers');
    this.Provider = new Web3Provider(this.web3Provider);
    // 12s minute polling interval (default is 4s)
    this.Provider.pollingInterval = 12000;
    // only Alpha has a guardian -- use to distinguish between types of governance contract
    try {
      this._Contract = GovernorAlpha__factory.connect(
        this.contractAddress,
        this.Provider,
      );
      await this.Contract.guardian();
      this._govType = GovernorType.Alpha;
      console.log(`Found GovAlpha contract at ${this.Contract.address}`);
    } catch (_e) {
      // either Bravo or Oz
      try {
        this._Contract = GovernorCompatibilityBravo__factory.connect(
          this.contractAddress,
          this.Provider,
        );
        await this.Contract.quorumVotes();
        console.log(
          `Found Bravo contract at ${this.Contract.address}, using GovernorCompatibilityBravo`,
        );
        this._govType = GovernorType.Bravo;
      } catch (_e2) {
        // test to ensure it is Oz-style
        try {
          this._Contract = GovernorCountingSimple__factory.connect(
            this.contractAddress,
            this.Provider,
          );
          await this.Contract.proposalVotes(1);
          console.log(
            `Found GovCountingSimple contract at ${this.Contract.address}, using GovernorCountingSimple`,
          );
          this._govType = GovernorType.Oz;
        } catch (_e3) {
          try {
            await (
              this._Contract as GovernorCompatibilityBravo
            ).COUNTING_MODE();
          } catch (e) {
            throw new Error(
              `Could not determine governance contract type of ${this.contractAddress}`,
            );
          }
          console.log(
            `Falling back to OpenZeppelin governor contract at ${this.Contract.address}`,
          );
          this._govType = GovernorType.Oz;
        }
      }
    }

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
          inputs: [],
          name: tokenName,
          outputs: [
            {
              name: '',
              type: 'address',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ];
      const iface = new utils.Interface(JSON.stringify(ABI));
      const data = iface.encodeFunctionData(tokenName);
      const resultData = await this.Contract.provider.call({
        to: this.Contract.address,
        data,
      });
      tokenAddress = utils.getAddress(
        Buffer.from(utils.stripZeros(resultData)).toString('hex'),
      );
    } catch (err) {
      console.error(`Could not fetch token ${tokenName}: ${err.message}`);
    }

    // query token and determine token capabilities (MPond vs ERC20VotesComp)
    if (tokenAddress) {
      this._Token = MPond__factory.connect(
        tokenAddress,
        this.Contract.signer || this.Contract.provider,
      );
      try {
        await this._Token.admin();
        this._tokenType = GovernorTokenType.MPondToken;
        console.log(`Found MPond-like Comp token at ${tokenAddress}`);
      } catch (_e) {
        // Either Comp or OZ Votes
        try {
          this._Token = ERC20VotesComp__factory.connect(
            tokenAddress,
            this.Contract.signer || this.Contract.provider,
          );
          await this._Token.getCurrentVotes(tokenAddress);
          this._tokenType = GovernorTokenType.Comp;
          console.log(
            `Found Comp-type token at ${tokenAddress}, using ERC20VotesComp`,
          );
        } catch (_e2) {
          // test to ensure it is Oz-style
          try {
            await this._Token.getVotes(tokenAddress);
          } catch (e) {
            throw new Error(
              `Could not determine token type of ${tokenAddress}`,
            );
          }
          this._tokenType = GovernorTokenType.OzVotes;
          console.log(
            `Falling back to OpenZeppelin ERC20Votes for token at ${tokenAddress}`,
          );
        }
      }
    } else {
      console.warn('No token contract found! Continuing...');
    }
  }
}
