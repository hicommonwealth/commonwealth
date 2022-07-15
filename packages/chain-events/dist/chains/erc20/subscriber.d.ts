import { IEventSubscriber } from '../../interfaces';
import { RawEvent, IErc20Contracts } from './types';
export declare class Subscriber extends IEventSubscriber<IErc20Contracts, RawEvent> {
    private _name;
    private _listener;
    constructor(api: IErc20Contracts, name: string, verbose?: boolean);
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    subscribe(cb: (event: RawEvent, tokenName?: string) => void): Promise<void>;
    unsubscribe(): void;
    addNewToken(tokenAddress: string, tokenName?: string, retryTimeMs?: number, retries?: number): Promise<void>;
}
