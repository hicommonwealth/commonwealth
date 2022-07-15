import { IProjectBaseFactory } from '../../contractTypes';
import { IEventSubscriber } from '../../interfaces';
import { RawEvent, Api, ProjectApi } from './types';
export declare function constructProjectApi(projectFactory: IProjectBaseFactory, address: string): Promise<ProjectApi>;
export declare class Subscriber extends IEventSubscriber<Api, RawEvent> {
    private _name;
    private _listener;
    constructor(api: Api, name: string, verbose?: boolean);
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    subscribe(cb: (event: RawEvent, contractAddress?: string) => void): Promise<void>;
    unsubscribe(): void;
}
