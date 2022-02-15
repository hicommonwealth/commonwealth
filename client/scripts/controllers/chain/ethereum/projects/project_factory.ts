import { providers } from 'ethers';
import moment from 'moment';
import app, { IApp } from 'state';
import { IProjectFactory, IProjectFactory__factory } from 'shared/eth/types';
import { AddressInfo } from 'models';
import { CWProject } from './project';
import { attachSigner } from '../contractApi';

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
  public get Provider() { return this._Provider; }

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
    await this._Contract.deployed();
    const response = await $.post(`${app.serverUrl()}/getUserProjects`, {
      'user': activeUserId,
    });
    this._Projects = response.result.map((project) => {
      // switch to passing in object?
      // check out chain controllers—initAPI vs initData
      return new CWProject(
        this._Provider,
        project.ipfsHash, // TODO: Reconcile this against address
        project.id,
        project.ipfsHash,
        project.beneficiary,
        project.creator,
        project.title,
        project.description,
        moment(project.deadline),
        project.threshold,
        project.curatorFee,
      )
    })
  }

  public async createProject(projectData: IProjectCreationData, chain) {
    // TODO: Create Project form should notify users that on-chain title will be truncated
    // to 32 chars
    // Form should represent token addresses as dropdown input (discrete options)
    if (!this.acceptedTokens.includes(projectData.token)) {
      throw new Error('Invalid token');
    }
    if (projectData.deadline < moment.duration('24', 'hours')) {
      throw new Error('Project duration must be minimum 24hrs');
    }
    if (projectData.threshold <= 0) {
      throw new Error('Invalid threshold/goal');
    }

    const curatorFee = Math.min(projectData.curatorFee, 10000 - this.protocolFee);

    const { beneficiary, title, description, token, threshold, deadline } = projectData;
    const creator = this.app.user.activeAccount.address;
    const contract = await attachSigner(this.app.wallets, creator, this.Contract);

    const tx = await contract.create(
      creator,
      beneficiary,
      title.slice(0, 32),
      token,
      threshold,
      deadline,
      curatorFee
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to create project contract`);
    }

    console.log({ tx, txReceipt });
    // if contractProject.success (roughly) -->

    try {
      const response = await $.post(`${app.serverUrl()}/createProject`, {
        // 'ipfsHash': ipfsHash, TODO: How to get IPFS Hash
        'chain': chain,
        'creator': creator,
        'beneficiary': beneficiary,
        'title': title,
        'description': description,
        'token': token,
        'threshold': threshold,
        'deadline': deadline,
        'curatorFee': curatorFee
      });

      const { result } = response;

      const project = new CWProject(
        this._Provider,
        txReceipt.hash,
        result.id,
        result.ipfsHash,
        result.beneficiary,
        result.creator,
        result.title,
        result.description,
        moment(result.deadline),
        result.threshold,
        result.curatorFee,
      );

      this._Projects.push(project);
    } catch (err) {
      // TODO: Error handling
    }
  }
}
