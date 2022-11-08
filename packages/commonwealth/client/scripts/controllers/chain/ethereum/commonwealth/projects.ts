import { IdStore } from 'stores';
import $ from 'jquery';
import {
  ICuratedProjectFactory__factory,
  ICuratedProject__factory,
} from 'common-common/src/eth/types';
import { ChainInfo, Project } from 'models';
import { IApp } from 'state';
import { ChainNetwork } from 'common-common/src/types';
import { BigNumberish, ContractReceipt } from 'ethers';
import { formatBytes32String } from 'ethers/lib/utils';
import { attachSigner } from './contractApi';

export type IProjectCreationData = {
  title: string; // TODO length limits for contract side
  shortDescription: string;
  description: string;
  coverImage: string;
  chainId: string;
  token: string;
  creator: string;
  beneficiary: string;
  threshold: BigNumberish;
  deadline: BigNumberish;
  curatorFee: BigNumberish;
};
export default class ProjectsController {
  private _initialized = false;
  public initialized() {
    return this._initialized;
  }

  private _initializing = false;
  public initializing() {
    return this._initializing;
  }

  // TODO: Graham 22-10-26: Build a generic CommunityIdStore which extends IdStore
  // and includes a _storeCommunityId substore. This would allow us to consolidate custom stores
  // such as ActivityStore, TopicStore, and DraftStore, and to remove filtering logic on
  // chain-scoped project listing pages.
  protected _store: IdStore<Project> = new IdStore();
  public get store() {
    return this._store;
  }

  private _factoryInfo: ChainInfo;
  private _app: IApp;

  private async _fetchProjectsFromServer(params: {
    projectId?: number;
    chainId?: string;
  }) {
    const { projectId, chainId } = params;
    const res = await $.get(`${this._app.serverUrl()}/getProjects`, {
      project_id: projectId,
      chain_id: chainId,
    });
    console.log({ res });
    for (const project of res.result) {
      try {
        const pObj = Project.fromJSON(project);
        console.log(pObj);
        if (!this._store.getById(pObj.id)) {
          this._store.add(pObj);
        } else {
          this._store.update(pObj);
        }
        console.log(this._store);
      } catch (e) {
        console.error(
          `Could not load project: ${JSON.stringify(project)}: ${e.message}`
        );
      }
    }
  }

  public async init(app: IApp) {
    this._initializing = true;
    this._app = app;

    // locate CWP community, containing factory address + node url
    this._factoryInfo = this._app.config.chains.getById(
      ChainNetwork.CommonProtocol
    );
    if (!this._factoryInfo) {
      console.error('CWP factory info not found!');
      this._initializing = false;
      return;
    }

    // load all projects from server
    try {
      await this._fetchProjectsFromServer({});
    } catch (e) {
      console.error(`Failed to load projects: ${e.message}`);
      this._initializing = false;
      return;
    }
    this._initialized = true;
    this._initializing = false;
  }

  // TODO: Should just be "create"
  public async createProject(
    projectData: IProjectCreationData
  ): Promise<[ContractReceipt, number]> {
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

    const ipfsContent = JSON.stringify(projectData);
    const {
      beneficiary,
      title,
      chainId,
      token,
      threshold,
      deadline,
      curatorFee,
    } = projectData;

    const creator = this._app.user.activeAccount;

    // upload ipfs content
    // TODO: should we check for failure vs success in result?
    let ipfsHash: string;
    try {
      // TODO: IPFS should include all user-submitted data incl cover image, description, etc
      const response = await $.post(`${this._app.serverUrl()}/ipfsPin`, {
        address: creator.address,
        author_chain: chainId || creator.chain.id,
        blob: ipfsContent,
        jwt: this._app.user.jwt,
      });
      ipfsHash = response.result;
    } catch (err) {
      throw new Error(`Failed to pin IPFS blob: ${err.message}`);
    }

    // instantiate contract (TODO: additional validation, or do this earlier)
    console.log(this._factoryInfo.node);
    const contract = await attachSigner(
      this._app.wallets,
      creator,
      null,
      this._factoryInfo.node,
      ICuratedProjectFactory__factory.connect,
      '0x9f20ed5f919dc1c1695042542c13adcfc100dcab'
    );

    const projectId = await contract.numProjects();
    console.log({ projectId });
    const cwUrl = `https://commonwealth.im/${chainId}/project/${projectId}`;

    console.log([
      formatBytes32String(title.slice(0, 30)),
      formatBytes32String(ipfsHash.slice(0, 30)),
      formatBytes32String(cwUrl.slice(0, 30)),
      beneficiary,
      token,
      threshold.toString(),
      deadline,
      curatorFee.toString(),
    ]);

    const tx = await contract.createProject(
      formatBytes32String(title.slice(0, 30)),
      formatBytes32String(ipfsHash.slice(0, 30)),
      formatBytes32String(cwUrl.slice(0, 30)),
      beneficiary,
      token,
      threshold.toString(),
      deadline,
      curatorFee.toString(),
      { gasLimit: 2000000 }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to create project contract`);
    }
    // TODO: disconnect provider?

    // on success, hit server to update chain
    // TODO: should we check for failure vs success in result?
    if (chainId) {
      try {
        await $.get(`${this._app.serverUrl()}/setProjectChain`, {
          chain_id: chainId,
          project_id: projectId,
          jwt: this._app.user.jwt,
        });
      } catch (err) {
        console.error(
          `Failed to set project ${projectId.toString()} chain to ${chainId}`
        );
      }
    }

    // refresh metadata + return final result
    await this._fetchProjectsFromServer({ projectId });
    return [txReceipt, projectId];
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
      this._factoryInfo.node,
      ICuratedProject__factory.connect,
      project.address
    );

    const tx = await contract.back(value);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to back');
    }
    // TODO: disconnect provider?

    // refresh metadata
    await this._fetchProjectsFromServer({ projectId });
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
      this._factoryInfo.node,
      ICuratedProject__factory.connect,
      project.address
    );

    const tx = await contract.curate(value);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to curate');
    }
    // TODO: disconnect provider?

    // refresh metadata
    await this._fetchProjectsFromServer({ projectId });
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
      this._factoryInfo.node,
      ICuratedProject__factory.connect,
      project.address
    );

    const tx = await contract.beneficiaryWithdraw();
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to withdraw');
    }
    // TODO: disconnect provider?

    // refresh metadata
    await this._fetchProjectsFromServer({ projectId });
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
      this._factoryInfo.node,
      ICuratedProject__factory.connect,
      project.address
    );

    const tx = await contract.backersWithdraw();
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to withdraw');
    }
    // TODO: disconnect provider?

    // refresh metadata
    await this._fetchProjectsFromServer({ projectId });
    return txReceipt;
  }

  public async curatorWithdraw(projectId: number) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const curator = this._app.user.activeAccount;
    const project = this._store.getById(projectId);
    if (
      !project.curateEvents.find(({ sender }) => sender === curator.address)
    ) {
      throw new Error('Must be backer to withdraw');
    }

    // make tx (TODO: additional validation, or do this earlier)
    const contract = await attachSigner(
      this._app.wallets,
      curator,
      null,
      this._factoryInfo.node,
      ICuratedProject__factory.connect,
      project.address
    );

    const tx = await contract.curatorsWithdraw();
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to withdraw');
    }
    // TODO: disconnect provider?

    // refresh metadata
    await this._fetchProjectsFromServer({ projectId });
    return txReceipt;
  }
}
