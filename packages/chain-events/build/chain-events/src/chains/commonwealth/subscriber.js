"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscriber = exports.constructProjectApi = void 0;
const contractTypes_1 = require("../../contractTypes");
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const types_1 = require("./types");
async function constructProjectApi(projectFactory, address) {
    const api = {
        project: contractTypes_1.ICuratedProject__factory.connect(address, projectFactory.provider),
        bToken: null,
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
exports.constructProjectApi = constructProjectApi;
class Subscriber extends interfaces_1.IEventSubscriber {
    _name;
    _listener;
    constructor(api, name, verbose = false) {
        super(api, verbose);
        this._name = name;
    }
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    async subscribe(cb) {
        this._listener = (contractAddress, contractType, event) => {
            const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Commonwealth, contractAddress]));
            const logStr = `Received ${this._name} event: ${JSON.stringify(event, null, 2)}.`;
            // eslint-disable-next-line no-unused-expressions
            this._verbose ? log.info(logStr) : log.trace(logStr);
            if (contractType === types_1.CommonContractType.Factory &&
                event.event === 'ProjectCreated') {
                // factories only emit create events, which require us to produce a new subscription
                const newProjectAddress = event.args[1];
                constructProjectApi(this._api.factory, newProjectAddress).then((project) => {
                    this._api.projects.push(project);
                    project.project.on('*', this._listener.bind(this, project.project.address, types_1.CommonContractType.Project));
                    /*
                        Do not subscribe to tokens, for time being
        
                    project.bToken.on(
                      '*',
                      this._listener.bind(
                        this,
                        project.bToken.address,
                        CommonContractType.bToken
                      )
                    );
                    if (project.cToken && project.isCurated) {
                      project.cToken.on(
                        '*',
                        this._listener.bind(
                          this,
                          project.cToken.address,
                          CommonContractType.cToken
                        )
                      );
                    }
                    */
                });
            }
            cb(event, contractAddress);
        };
        // create subscription for factory
        this._api.factory.on('*', (args) => this._listener(this._api.factory.address, types_1.CommonContractType.Factory, args));
        // create subscriptions for all projects
        for (const project of this._api.projects) {
            project.project.on('*', (args) => this._listener(project.project.address, types_1.CommonContractType.Project, args));
        }
    }
    unsubscribe() {
        if (this._listener) {
            this._api.projects.forEach(({ project /* , cToken, bToken, isCurated */ }) => {
                project.removeAllListeners();
                // bToken.removeAllListeners();
                // if (cToken && isCurated) cToken.removeAllListeners();
            });
            this._api.projects = [];
            this._api.factory.removeAllListeners();
            this._listener = null;
        }
    }
}
exports.Subscriber = Subscriber;
