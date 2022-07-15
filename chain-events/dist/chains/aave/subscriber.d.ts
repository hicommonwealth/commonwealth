import { IEventSubscriber } from '../../interfaces';
import { RawEvent, Api } from './types';
export declare class Subscriber extends IEventSubscriber<Api, RawEvent> {
    private _name;
    private _listener;
    protected readonly log: any;
    constructor(api: Api, name: string, verbose?: boolean);
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    subscribe(cb: (event: RawEvent) => void): Promise<void>;
    unsubscribe(): void;
}
