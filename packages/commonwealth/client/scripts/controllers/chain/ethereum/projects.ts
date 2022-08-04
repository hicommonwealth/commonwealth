import { IdStore } from 'stores';
import $ from 'jquery';
import { ICuratedProjectFactory__factory, ICuratedProject__factory } from 'eth/types';
import { NodeInfo, Project } from 'models';
import { IApp } from 'state';
import { ChainNetwork } from 'types';
import BN from 'bn.js';
import { attachSigner } from './contractApi';

export type IProjectCreationData = {
  ipfsContent: string;
  cwUrl: string;
  title: string; // TODO length limits for contract side
  chain: string;
  token: string;
  creator: string;
  beneficiary: string;
  threshold: BN;
  deadline: number; // unix timestamp
  curatorFee: BN;
}

export default class ProjectsController {
  private _initialized = false;
  public initialized() { return this._initialized; }

  private _initializing = false;
  public initializing() { return this._initializing; }

  protected _store: IdStore<Project> = new IdStore();
  public get store() { return this._store; }

  private _factoryInfo: NodeInfo;
  private _factoryAddress: string;
  private _app: IApp;

  private async _loadProjectsFromServer(project_id?: number) {
    const res = await $.getJSON(`${this._app.serverUrl()}/getProjects`, project_id ? { project_id } : {});
    for (const project of res.result) {
      try {
        const pObj = Project.fromJSON(project);
        if (!this._store.getById(pObj.id)) {
          this._store.add(pObj);
        } else {
          this._store.update(pObj);
        }
      } catch (e) {
        console.error(`Could not load project: ${JSON.stringify(project)}: ${e.message}`);
      }
    }
  }

  public async init(app: IApp) {
    this._initializing = true;
    this._app = app;
    // locate CWP community, containing factory address + node url
    console.log(this._app.config.chains.getById(ChainNetwork.CommonProtocol));
    this._factoryAddress = this._app.config.chains.getById(ChainNetwork.CommonProtocol).address;
    this._factoryInfo = this._app.config.chains.getById(ChainNetwork.CommonProtocol).node;
    if (!this._factoryInfo) {
      console.error('CWP factory info not found!');
      this._initializing = false;
      return;
    }
    // load all projects from server
    try {
      await this._loadProjectsFromServer();
    } catch (e) {
      console.error(`Failed to load projects: ${e.message}`);
      this._initializing = false
      return;
    }
    this._initialized = true;
    this._initializing = false;
  }

  public async createProject(projectData: IProjectCreationData) {
    if (!this._initialized) throw new Error('Projects not yet initialized');

    // TODO: validate arguments

    // TODO: Create Project form should notify users that on-chain title will be truncated
    // to 32 chars
    // Form should represent token addresses as dropdown input (discrete options)
    // if (!this.acceptedTokens.includes(projectData.token)) {
    //   throw new Error('Invalid token');
    // }
    // if (projectData.deadline < moment.duration('24', 'hours')) {
    //   throw new Error('Project duration must be minimum 24hrs');
    // }
    // if (projectData.threshold <= 0) {
    //   throw new Error('Invalid threshold/goal');
    // }
    // const curatorFee = Math.min(projectData.curatorFee, 10000 - this.protocolFee);

    const { beneficiary, title, cwUrl, ipfsContent, chain, token, threshold, deadline, curatorFee } = projectData;
    const creator = this._app.user.activeAccount;
    console.log(`got project data! ${beneficiary}`);
    // upload ipfs content
    // TODO: should we check for failure vs success in result?
    let ipfsHash: string;
    try {
      const response = await $.post(`${this._app.serverUrl()}/ipfsPin`, {
        address: creator.address,
        author_chain: chain || creator.chain.id,
        blob: ipfsContent,
        jwt: this._app.user.jwt,
      });
      ipfsHash = response.result;
    } catch (err) {
      throw new Error(`Failed to pin IPFS blob: ${err.message}`);
    }

    // instantiate contract (TODO: additional validation, or do this earlier)
    const contract = await attachSigner(
      this._app.wallets,
      creator,
      null,
      ICuratedProjectFactory__factory.connect,
      this._factoryAddress
    );

    const projectId = (await contract.numProjects()).toNumber();
    const tx = await contract.createProject(
      title.slice(0, 32),
      ipfsHash,
      cwUrl,
      beneficiary,
      token,
      threshold.toString(),
      deadline,
      curatorFee.toString(),
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to create project contract`);
    }
    // TODO: disconnect provider?

    // on success, hit server to update chain
    // TODO: should we check for failure vs success in result?
    if (chain) {
      try {
        await $.get(`${this._app.serverUrl()}/setProjectChain`, {
          chain_id: chain,
          project_id: projectId,
          jwt: this._app.user.jwt,
        });
      } catch (err) {
        console.error(`Failed to set project ${projectId.toString()} chain to ${chain}`);
      }
    }

    // refresh metadata + return final result
    await this._loadProjectsFromServer(projectId);
    return txReceipt;
  }

  public async back(projectId: number, value: string) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const backer = this._app.user.activeAccount;
    const project = this._store.getById(projectId);

    // make tx (TODO: additional validation, or do this earlier)
    const contract = await attachSigner(
      this._app.wallets,
      backer,
      null,
      ICuratedProject__factory.connect,
      project.address,
    );

    const tx = await contract.back(value, { from: backer.address });
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to back');
    }
    // TODO: disconnect provider?

    // refresh metadata
    await this._loadProjectsFromServer(projectId);
    return txReceipt;
  }

  public async curate(projectId: number, value: string) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const curator = this._app.user.activeAccount;
    const project = this._store.getById(projectId);

    // make tx (TODO: additional validation, or do this earlier)
    const contract = await attachSigner(
      this._app.wallets,
      curator,
      null,
      ICuratedProject__factory.connect,
      project.address,
    );

    const tx = await contract.curate(value, { from: curator.address });
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to curate');
    }
    // TODO: disconnect provider?

    // refresh metadata
    await this._loadProjectsFromServer(projectId);
    return txReceipt;
  }

  public async beneficiaryWithdraw(projectId: number) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const beneficiary = this._app.user.activeAccount;
    const project = this._store.getById(projectId);
    if (beneficiary.address !== project.beneficiary) {
      throw new Error('Must be beneficiary to withdraw');
    }

    // make tx (TODO: additional validation, or do this earlier)
    const contract = await attachSigner(
      this._app.wallets,
      beneficiary,
      null,
      ICuratedProject__factory.connect,
      project.address,
    );

    const tx = await contract.beneficiaryWithdraw({ from: beneficiary.address });
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to withdraw');
    }
    // TODO: disconnect provider?

    // refresh metadata
    await this._loadProjectsFromServer(projectId);
    return txReceipt;
  }

  public async backerWithdraw(projectId: number) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const backer = this._app.user.activeAccount;
    const project = this._store.getById(projectId);
    if (!project.backEvents.find(({ sender }) => sender === backer.address)) {
      throw new Error('Must be backer to withdraw');
    }

    // make tx (TODO: additional validation, or do this earlier)
    const contract = await attachSigner(
      this._app.wallets,
      backer,
      null,
      ICuratedProject__factory.connect,
      project.address,
    );

    const tx = await contract.backersWithdraw({ from: backer.address });
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to withdraw');
    }
    // TODO: disconnect provider?

    // refresh metadata
    await this._loadProjectsFromServer(projectId);
    return txReceipt;
  }

  public async curatorWithdraw(projectId: number) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const curator = this._app.user.activeAccount;
    const project = this._store.getById(projectId);
    if (!project.curateEvents.find(({ sender }) => sender === curator.address)) {
      throw new Error('Must be backer to withdraw');
    }

    // make tx (TODO: additional validation, or do this earlier)
    const contract = await attachSigner(
      this._app.wallets,
      curator,
      null,
      ICuratedProject__factory.connect,
      project.address,
    );

    const tx = await contract.curatorsWithdraw({ from: curator.address });
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to withdraw');
    }
    // TODO: disconnect provider?

    // refresh metadata
    await this._loadProjectsFromServer(projectId);
    return txReceipt;
  }
}
