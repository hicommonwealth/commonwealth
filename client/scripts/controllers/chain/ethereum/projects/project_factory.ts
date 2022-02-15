import { providers } from 'ethers';
import moment from 'moment';
import app from 'state';
import { IProjectFactory, IProjectFactory__factory } from 'eth/types';
import { AddressInfo } from 'models';
import { CWProject } from './project';

// For project creation input
interface IProjectCreationData {
  title: string; // TODO length limits for contract side
  description: string;
  token: string;
  creator: AddressInfo;
  beneficiary: string;
  threshold: number; // Maybe BigNumber?
  deadline: moment.Duration
  curatorFee: number;
}

// May end up determining which factory contract gets called
// + which type of project contract gets created
enum ProjectFactoryTypes {
  Simple = 'simple',
  Curated = 'curated',
}

export class CWProjectFactory {
  // Prefer true readonly if you can set it in constructor
  // Consider passing in a single variable
  private _Provider: providers.Provider;

  private _Contract: IProjectFactory;
  public get Contract() { return this._Contract; }

  private _Projects: CWProject[];
  public get Projects() { return this._Projects; }

  // TODO: projectImp, cwTokenImp—what the hell are these and what do I do with them

  // address _owner,
  // address[] memory _acceptedTokens,
  // uint256 _protocolFee,
  // address payable _feeTo,
  // address _projectImp,
  // address _cwTokenImp
  constructor(
    public readonly owner: string,
    public readonly factoryType: ProjectFactoryTypes,
    public readonly acceptedTokens: string[],
    public readonly protocolFee: number,
    public readonly maxFee: number,
    public readonly feeTo: string,
  ) {
    this.owner = owner; // TODO admin check
    this.factoryType = factoryType;
    this.acceptedTokens = acceptedTokens;
    this.protocolFee = Math.min(maxFee, protocolFee);
    this.maxFee = maxFee;
    this.feeTo = feeTo;
  }

  // always going to be eth mainnet + our common projectfactory address
  public async init(url: string, contractAddress: string, activeUserId: number) {
    this._Provider = new providers.WebSocketProvider(url);
    this._Contract = IProjectFactory__factory.connect(contractAddress, this._Provider);
    // might need an await this._Contract.deployed
    const response = await $.post(`${app.serverUrl()}/getUserProjects`, {
      'user': activeUserId,
    });
    this._Projects = response.result.map((project) => {
      // switch to passing in object
      // check out chain controllers—initAPI vs initData
      return new CWProject(
        this._Provider,
        project
      )
    })
  }

  public async createProject(projectData: IProjectCreationData, chain, creator) {
    if (!this.acceptedTokens.includes(projectData.token)) {
      throw new Error('Invalid token');
    }
    if (projectData.deadline < moment.duration('24', 'hours')) {
      throw new Error('Project duration must be minimum 24hrs');
    }
    if (projectData.threshold <= 0) {
      throw new Error('Invalid threshold/goal');
    }

    const curatorFee = Math.min(projectData.curatorFee, 10000 - this._protocolFee);
    // const title = // TODO: Shorten on-chain title automatically to max length to save space?
    const contractProject = await this._Contract.create(
      projectData.title,
      projectData.beneficiary,
      projectData.token,
      projectData.threshold,
      projectData.deadline,
      curatorFee
    );
    // look up attachSigner fn b/c you'll need a wallet tx
    // contractProject is a tx object; wait for it to complete
    // make sure isnt' added to db if fail

    try {
      const response = await $.post(`${app.serverUrl()}/createProject`, {
        // 'ipfsHash': ipfsHash, TODO: How to get IPFS Hash
        'chain': chain,
        'creator': creator,
        'beneficiary': projectData.beneficiary,
        'title': projectData.title,
        'description': projectData.description,
        'token': projectData.token,
        'threshold': projectData.threshold,
        'deadline': projectData.deadline,
        'curatorFee': projectData.curatorFee
      });

      const { result } = response;

      const project = new CWProject(
        this._Provider,
        // TODO reconcile against other hashes/addresses, understand how they are similar or distinct
        contractProject.hash,
        result.id,
        result.ipfsHash,
        result.beneficiary,
        result.creator,
        result.title,
        result.description,
        moment(result.deadline),
        result.threshold,
        result.curatorFee
      );

      this._Projects.push(project);
    } catch (err) {
      // TODO: Error handling
    }
  }
}