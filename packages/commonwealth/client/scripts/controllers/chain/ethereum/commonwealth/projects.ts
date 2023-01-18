import { IdStore } from 'stores';
import $ from 'jquery';
import m from 'mithril';
import {
  ICuratedProjectFactory__factory,
  ICuratedProject__factory,
  IERC20__factory,
} from 'common-common/src/eth/types';
import { CommonwealthTypes } from 'chain-events/src';
import { ChainEntity, ChainInfo, Project } from 'models';
import { IProjectCreationData } from 'models/Project';
import { IApp } from 'state';
import { ChainNetwork } from 'common-common/src/types';
import { getBaseUrl, getFetch, ServiceUrls } from 'helpers/getUrl';
import { ContractReceipt, BigNumber, constants } from 'ethers';
import { formatBytes32String } from 'ethers/lib/utils';
import { attachSigner } from './contractApi';

// TODO: this file needs to be reworked + Projects model as well

export default class ProjectsController {
  private _initialized = false;
  public initialized() {
    return this._initialized;
  }

  private _initializing = false;
  public initializing() {
    return this._initializing;
  }

  protected _store: IdStore<Project> = new IdStore();
  public get store() {
    return this._store;
  }

  private _factoryInfo: ChainInfo;
  private _app: IApp;

  private acceptedProjectTokens: string[] = ["0x11eF819024de53671633cC27AA65Fd354d783178"]

  // initializes a new Project object from an entity by querying its IPFS metadata
  private async _initProject(entity: ChainEntity, projectChain?: string): Promise<Project> {
    // retrieve IPFS hash from events and query ipfs data
    const createEvent = entity.chainEvents.find((e) => e.data.kind === CommonwealthTypes.EventKind.ProjectCreated);
    const ipfsHash = (createEvent.data as CommonwealthTypes.IProjectCreated).ipfsHash;
    const ipfsData = await $.get(`${getBaseUrl()}/ipfsProxy/${ipfsHash}`);

    return new Project(entity, ipfsData, projectChain);
  }

  // Refreshes a single project's entity data
  private async _refreshProject(projectId: string, projectChain?: string) {
    const options: Record<string, unknown> = { chain: ChainNetwork.CommonProtocol };
    if (projectId) {
      options.type_id = projectId;
    }
    let entityJSON;
    try {
      entityJSON = await getFetch(
        `${getBaseUrl()}/entities`,
        {
          chain: ChainNetwork.CommonProtocol,
          type_id: projectId
        }
      );
    } catch(e) {
      console.error(`Failed to refresh projects: ${e.message}`);
      return
    }
    if (entityJSON?.length > 0) {
      const entity = ChainEntity.fromJSON(entityJSON[0]);
      const project = this._store.getById(projectId);
      if (!project) {
        // newly created entity -- init based on IPFS data
        const newProject = await this._initProject(entity, projectChain);
        this._store.add(newProject);
      } else {
        project.setEntity(entity);
      }
    }
  }

  // Queries all extant Common Protocol projects -- used for initializing the controller
  private async _initProjects() {
    // TODO later: only fetch for chain => currently no way to filter query beyond "all projects"
    const options: Record<string, unknown> = { chain: ChainNetwork.CommonProtocol };

    // entities contain the needed data, entityMeta contains source_chain
    const [entities, entityMetas] = await Promise.all([
      getFetch(`${getBaseUrl()}/entities`, options),
      getFetch(`${getBaseUrl()}/getEntityMeta`, options),
    ]);

    await Promise.all(entities.map(async (entityJSON) => {
      const entity = ChainEntity.fromJSON(entityJSON);

      // query chain entity metas for project chain (i.e. community that created it)
      const projectChain = entityMetas.find((meta) => meta.type_id === entity.typeId)?.project_chain;
      const project = await this._initProject(entity, projectChain);
      this._store.add(project);
    }));
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
      await this._initProjects();
    } catch (e) {
      console.error(`Failed to load projects: ${e.message}`);
      this._initializing = false;
      return;
    }
    this._initialized = true;
    this._initializing = false;
    m.redraw(); // force redraw to show projects @TODO Remove hack
  }

  public async getAcceptedProjectTokens() {
    let i = 0;
    const acceptedTokens = [];
    while(true) {
      let token: string;
      try {
        token = await this.acceptedProjectToken(i);
        i++
      } catch(e) {
        return acceptedTokens;
      }
      acceptedTokens.push(token)
    }
  }

  public async acceptedProjectToken(tokenIndex: number) {
    const creator = this._app.user.activeAccount;

    const projectFactoryContract = await attachSigner(
      this._app.wallets,
      creator,
      null,
      this._factoryInfo.node,
      ICuratedProjectFactory__factory.connect,
      '0x6f2b3594E54BAAcCB5A7AE93185e1A4fa82Ba67a'
    );
    const token = await projectFactoryContract.acceptedTokens(tokenIndex);
    return token;
  }

  public async create(
    projectData: IProjectCreationData
  ): Promise<[ContractReceipt, string]> {
    if (!this._initialized) throw new Error('Projects not yet initialized');

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

    const projectFactoryContract = await attachSigner(
      this._app.wallets,
      creator,
      null,
      this._factoryInfo.node,
      ICuratedProjectFactory__factory.connect,
      '0x6f2b3594E54BAAcCB5A7AE93185e1A4fa82Ba67a'
    );
    // upload ipfs content
    let ipfsHash: string;
    try {
      const response = await $.post(`${this._app.serverUrl()}/ipfsPin`, {
        address: creator.address,
        author_chain: chainId || creator.chain.id,
        blob: ipfsContent,
        jwt: this._app.user.jwt,
      });
      if (response.status !== 'Success') {
        throw new Error();
      }
      ipfsHash = response.result;
    } catch (err) {
      throw new Error(`Failed to pin IPFS blob: ${err.message}`);
    }

    const projectIndex = await projectFactoryContract.numProjects();
    // The Project Id is the address of the Curated Project
    const projectId = await projectFactoryContract.projects(projectIndex);
    const cwUrl = `https://commonwealth.im/${chainId}/project/${projectId}`;

    // TODO: fix IPFS formatting here
    console.log([
      formatBytes32String(title.slice(0, 30)),
      formatBytes32String(ipfsHash.slice(0, 30)),
      formatBytes32String(cwUrl.slice(0, 30)),
      beneficiary,
      token,
      threshold.toString(),
      deadline.toString(),
      curatorFee.toString(),
    ]);

    const tx = await projectFactoryContract.createProject(
      formatBytes32String(title.slice(0, 30)),
      formatBytes32String(ipfsHash.slice(0, 30)),
      formatBytes32String(cwUrl.slice(0, 30)),
      beneficiary,
      token,
      threshold.toString(),
      deadline.toString(),
      curatorFee.toString(),
      { gasLimit: 2000000 }
    );
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to create project contract`);
    }

    // JAKE TODO: disconnect provider?
    // on success, hit server to update chain
    // TODO: retry every X seconds, Y times -- eventually fail
    if (chainId) {
      try {
        const response = await $.get(
          `${this._app.serverUrl()}/setProjectChain`,
          {
            chain_id: chainId,
            project_id: projectId,
            jwt: this._app.user.jwt,
          }
        );
        if (response.status !== 'Success') {
          throw new Error();
        }

        // refresh with chain set
        await this._refreshProject(projectId, chainId);
      } catch (err) {
        console.error(
          `Failed to set project ${projectId.toString()} chain to ${chainId}`
        );

        // refresh with chain unset
        // however we should probably find out why this failed => if the entity doesn't exist, this wont work
        await this._refreshProject(projectId);
      }
    }

    return [txReceipt, projectId];
  }

  public async projectData(projectId: string): Promise<[BigNumber, BigNumber, string, string]>  {
    const caller = this._app.user.activeAccount;
    const project = this._store.getById(projectId);

    const contract = await attachSigner(
      this._app.wallets,
      caller,
      null,
      this._factoryInfo.node,
      ICuratedProject__factory.connect,
      project.address
    );

    const [threshold, deadline, beneficiary, acceptedToken] = await contract.projectData();
    return [threshold, deadline, beneficiary, acceptedToken]
  }

  public async getUserERC20TokenBalance(tokenAddress: string): Promise<string> {
    const caller = this._app.user.activeAccount;
    const contract = await attachSigner(
      this._app.wallets,
      caller,
      null,
      this._factoryInfo.node,
      IERC20__factory.connect,
      tokenAddress
    );
    const walletAddress = await contract.signer.getAddress()
    const tokenBalance = await contract.balanceOf(walletAddress)
    return tokenBalance.toString();
  }

  public async getUserERC20TokenAllowance(projectId: string, tokenAddress: string): Promise<string> {
    const caller = this._app.user.activeAccount;
    const project = this._store.getById(projectId);

    const contract = await attachSigner(
      this._app.wallets,
      caller,
      null,
      this._factoryInfo.node,
      IERC20__factory.connect,
      tokenAddress
    );
    const walletAddress = await contract.signer.getAddress()
    const allowance = await contract.allowance(walletAddress, project.address)
    return allowance.toString();
  }

  public async approveToken(projectId: string, tokenAddress: string) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const caller = this._app.user.activeAccount;
    const project = this._store.getById(projectId);

    // make tx (TODO: additional validation, or do this earlier)
    const contract = await attachSigner(
      this._app.wallets,
      caller,
      null,
      this._factoryInfo.node,
      IERC20__factory.connect,
      tokenAddress
    );

    const tx = await contract.approve(project.address, constants.MaxUint256);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Failed to Approve Token Address ${tokenAddress}`);
    }

    // refresh metadata
    await this._refreshProject(projectId);
    return txReceipt;
  }


  public async back(projectId: string, value: string) {
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
    // JAKE TODO: disconnect provider?

    // refresh metadata
    await this._refreshProject(projectId);
    return txReceipt;
  }

  public async curate(projectId: string, value: string) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const curator = this._app.user.activeAccount;
    const project = this._store.getById(projectId);

    // make tx (JAKE TODO: additional validation, or do this earlier)
    const contract = await attachSigner(
      this._app.wallets,
      curator,
      null,
      this._factoryInfo.node,
      ICuratedProject__factory.connect,
      project?.address
    );

    const tx = await contract.curate(value);
    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error('Failed to curate');
    }
    // JAKE TODO: disconnect provider?

    // refresh metadata
    await this._refreshProject(projectId);
    return txReceipt;
  }

  public async beneficiaryWithdraw(projectId: string) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const beneficiary = this._app.user.activeAccount;
    const project = this._store.getById(projectId);
    if (beneficiary.address !== project.beneficiary) {
      throw new Error('Must be beneficiary to withdraw');
    }

    // make tx (JAKE TODO: additional validation, or do this earlier)
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
    await this._refreshProject(projectId);
    return txReceipt;
  }

  public async backerWithdraw(projectId: string) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const backer = this._app.user.activeAccount;
    const project = this._store.getById(projectId);
    if (!project.backEvents.find(({ sender }) => sender === backer.address)) {
      throw new Error('Must be backer to withdraw');
    }

    // make tx (JAKE TODO: additional validation, or do this earlier)
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
    await this._refreshProject(projectId);
    return txReceipt;
  }

  public async curatorWithdraw(projectId: string) {
    if (!this._initialized) throw new Error('Projects not yet initialized');
    const curator = this._app.user.activeAccount;
    const project = this._store.getById(projectId);
    if (
      !project.curateEvents.find(({ sender }) => sender === curator.address)
    ) {
      throw new Error('Must be backer to withdraw');
    }

    // make tx (JAKE TODO: additional validation, or do this earlier)
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
    // JAKE TODO: disconnect provider?

    // refresh metadata
    await this._refreshProject(projectId);
    return txReceipt;
  }
}
