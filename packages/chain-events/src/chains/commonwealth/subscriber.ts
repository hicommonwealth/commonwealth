/* eslint-disable camelcase */
/**
 * Fetches events from ERC20 contract in real time.
 */
import { Listener } from '@ethersproject/providers';

import {
  ICuratedProject__factory,
  // IERC20__factory,
  IProjectBaseFactory,
} from '../../contractTypes';
import { IEventSubscriber, SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { RawEvent, Api, ProjectApi, ContractType } from './types';

export async function constructProjectApi(
  projectFactory: IProjectBaseFactory,
  address: string
): Promise<ProjectApi> {
  const api: ProjectApi = {
    project: ICuratedProject__factory.connect(address, projectFactory.provider),
    bToken: null, // TODO: populate
    cToken: null,
    isCurated: null,
  };
  await api.project.deployed();

  /*
    Do not subscribe to tokens, for the time being

  // construct bToken (always available)
  const bTokenAddress = await api.project.bToken();
  api.bToken = IERC20__factory.connect(
    bTokenAddress,
    projectFactory.provider
  );

  // discover curation status
  try {
    const cTokenAddress = await api.project.cToken();
    api.cToken = IERC20__factory.connect(
      cTokenAddress,
      projectFactory.provider
    );
    api.isCurated = true;
  } catch (e) {
    api.isCurated = false;
  }
  */
  return api;
}

export class Subscriber extends IEventSubscriber<Api, RawEvent> {
  private _name: string;

  private _listener: Listener | null;

  constructor(api: Api, name: string, verbose = false) {
    super(api, verbose);
    this._name = name;
  }

  /**
   * Initializes subscription to chain and starts emitting events.
   */
  public async subscribe(
    cb: (event: RawEvent, contractAddress?: string) => void
  ): Promise<void> {
    this._listener = (
      contractAddress: string,
      contractType: ContractType,
      event: RawEvent
    ): void => {
      const log = factory.getLogger(
        addPrefix(__filename, [SupportedNetwork.Commonwealth, contractAddress])
      );
      const logStr = `Received ${this._name} event: ${JSON.stringify(
        event,
        null,
        2
      )}.`;
      // eslint-disable-next-line no-unused-expressions
      this._verbose ? log.info(logStr) : log.trace(logStr);

      if (
        contractType === ContractType.Factory &&
        event.event === 'ProjectCreated'
      ) {
        // factories only emit create events, which require us to produce a new subscription
        const newProjectAddress: string = event.args[1];
        constructProjectApi(this._api.factory, newProjectAddress).then(
          (project) => {
            this._api.projects.push(project);
            project.project.on(
              '*',
              this._listener.bind(
                this,
                project.project.address,
                ContractType.Project
              )
            );

            /*
                Do not subscribe to tokens, for time being

            project.bToken.on(
              '*',
              this._listener.bind(
                this,
                project.bToken.address,
                ContractType.bToken
              )
            );
            if (project.cToken && project.isCurated) {
              project.cToken.on(
                '*',
                this._listener.bind(
                  this,
                  project.cToken.address,
                  ContractType.cToken
                )
              );
            }
            */
          }
        );
      }
      cb(event, contractAddress);
    };

    // create subscription for factory
    this._api.factory.on('*', (args) =>
      this._listener(this._api.factory.address, ContractType.Factory, args)
    );

    // create subscriptions for all projects
    for (const project of this._api.projects) {
      project.project.on('*', (args) =>
        this._listener(project.project.address, ContractType.Project, args)
      );
    }
  }

  public unsubscribe(): void {
    if (this._listener) {
      this._api.projects.forEach(
        ({ project /* , cToken, bToken, isCurated */ }) => {
          project.removeAllListeners();
          // bToken.removeAllListeners();
          // if (cToken && isCurated) cToken.removeAllListeners();
        }
      );
      this._api.projects = [];
      this._api.factory.removeAllListeners();
      this._listener = null;
    }
  }
}
