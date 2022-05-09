import { IdStore } from 'stores';
import $ from 'jquery';
import { ICuratedProject, ICuratedProject__factory } from 'eth/types';
import { NodeInfo, Project } from 'models';
import { IApp } from 'state';
import { ChainNetwork } from 'types';

export default class ProjectsController {
  private _initialized = false;
  public initialized() { return this._initialized; }

  private _initializing = false;
  public initializing() { return this._initializing; }

  protected _store: IdStore<Project> = new IdStore();
  public get store() { return this._store; }

  private _factoryInfo: NodeInfo;

  constructor(private readonly _app: IApp) { }

  private async _loadProjectsFromServer() {
    const res = await $.getJSON(`${this._app.serverUrl()}/getProjects`);
    for (const project of res) {
      try {
        const pObj = Project.fromJSON(project);
        this._store.add(pObj);
      } catch (e) {
        console.error(`Could not load project: ${JSON.stringify(project)}: ${e.message}`);
      }
    }
  }

  public async init() {
    this._initializing = true;

    // locate CWP community, containing factory address + node url
    this._factoryInfo = this._app.config.nodes.getById(ChainNetwork.CommonProtocol);
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

  // TODO: write controllers for txs that take a Project object and the data + init a connection
  //       based on factoryInfo, then perform the tx.
}
