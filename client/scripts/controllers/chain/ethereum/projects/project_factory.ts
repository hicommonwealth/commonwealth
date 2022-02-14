// import { providers } from "ethers";
// import moment from "moment";
// import app from "state";
// import { IProjectFactory, IProjectFactory__factory } from "shared/eth/types";
// import { AddressInfo } from 'models';
// import { CWProject } from "./project";

// // For project creation input
// interface IProjectCreationData {
//   title: string; // TODO length limits for contract side
//   description: string;
//   token: string;
//   creator: AddressInfo;
//   beneficiary: string;
//   threshold: number; // Maybe BigNumber?
//   deadline: moment.Duration;
//   curatorFee: number;
// }

// // May end up determining which factory contract gets called
// // + which type of project contract gets created
// enum ProjectFactoryTypes {
//   Simple = 'simple',
//   Curated = 'curated',
// }

// export class CWProjectFactory {
//   private _Provider: providers.Provider;

//   private _Contract: IProjectFactory;
//   public get Contract() { return this._Contract; }

//   private _Projects: CWProject[];
//   public get Projects() { return this._Projects; }

//   private _owner: string;
//   public get owner() { return this._owner; }

//   private _acceptedTokens: string[];
//   public get acceptedTokens() { return this._acceptedTokens; }

//   private _factoryType: ProjectFactoryTypes;
//   public get factoryType() { return this._factoryType; }

//   private _protocolFee: number;
//   public get protocolFee() { return this._protocolFee; }

//   private _maxFee: number;
//   public get maxFee() { return this._maxFee; }

//   private _feeTo: string;
//   public get feeTo() { return this._feeTo; }

//   // TODO: projectImp, cwTokenImp—what the hell are these and what do I do with them

//   // address _owner,
//   // address[] memory _acceptedTokens,
//   // uint256 _protocolFee,
//   // address payable _feeTo,
//   // address _projectImp,
//   // address _cwTokenImp
//   constructor(
//     owner: string,
//     factoryType: ProjectFactoryTypes,
//     acceptedTokens: string[],
//     protocolFee: number,
//     maxFee: number,
//     feeTo: string,
//   ) {
//     this._owner = owner; // TODO admin check
//     this._factoryType = factoryType;
//     this._acceptedTokens = acceptedTokens;
//     this._protocolFee = Math.min(maxFee, protocolFee);
//     this._maxFee = maxFee;
//     this._feeTo = feeTo;
//   }

//   // always going to be eth mainnet + our common projectfactory address
//   public async init(url: string, contractAddress: string, activeUserId: number) {
//     this._Provider = new providers.WebSocketProvider(url);
//     this._Contract = IProjectFactory__factory.connect(contractAddress, this._Provider);
//     const response = await $.post(`${app.serverUrl()}/getUserProjects`, {
//       'user': activeUserId,
//     });
//     this._Projects = response.result.map((project) => {
//       return new CWProject(
//         this._Provider,
//         project.ipfsHash, // TODO: Reconcile this against address
//         project.id,
//         project.ipfsHash,
//         project.beneficiary,
//         project.creator,
//         project.title,
//         project.description,
//         moment(project.deadline),
//         project.threshold,
//         project.curatorFee
//       )
//     })
//   }

//   public async createProject(projectData: IProjectCreationData, chain, creator) {
//     if (!this.acceptedTokens.includes(projectData.token)) {
//       throw new Error('Invalid token');
//     }
//     if (projectData.deadline < moment.duration('24', 'hours')) {
//       throw new Error('Project duration must be minimum 24hrs');
//     }
//     if (projectData.threshold <= 0) {
//       throw new Error('Invalid threshold/goal');
//     }

//     const curatorFee = Math.min(projectData.curatorFee, 10000 - this._protocolFee);
//     // const title = // TODO: Shorten on-chain title automatically to max length to save space?
//     const contractProject = await this._Contract.create(
//       projectData.title,
//       projectData.beneficiary,
//       projectData.token,
//       projectData.threshold,
//       projectData.deadline,
//       curatorFee
//     );

//     try {
//       const response = await $.post(`${app.serverUrl()}/createProject`, {
//         // 'ipfsHash': ipfsHash, TODO: How to get IPFS Hash
//         'chain': chain,
//         'creator': creator,
//         'beneficiary': projectData.beneficiary,
//         'title': projectData.title,
//         'description': projectData.description,
//         'token': projectData.token,
//         'threshold': projectData.threshold,
//         'deadline': projectData.deadline,
//         'curatorFee': projectData.curatorFee
//       });

//       const { result } = response;

//       const project = new CWProject(
//         this._Provider,
//         // TODO reconcile against other hashes/addresses, understand how they are similar or distinct
//         contractProject.hash,
//         result.id,
//         result.ipfsHash,
//         result.beneficiary,
//         result.creator,
//         result.title,
//         result.description,
//         moment(result.deadline),
//         result.threshold,
//         result.curatorFee
//       );

//       this._Projects.push(project);
//     } catch (err) {
//       // TODO: Error handling
//     }
//   }
// }