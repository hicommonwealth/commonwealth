import { CWEvent } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { EventKind, IErc721Contracts, ListenerOptions as Erc721ListenerOptions, RawEvent } from './types';
import { Processor } from './processor';
import { Subscriber } from './subscriber';
export declare class Listener extends BaseListener<IErc721Contracts, never, Processor, Subscriber, EventKind> {
    private readonly _options;
    protected readonly log: any;
    constructor(chain: string, tokenAddresses: string[], url?: string, tokenNames?: string[], verbose?: boolean);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    protected handleEvent(event: CWEvent): Promise<void>;
    protected processBlock(event: RawEvent, tokenName?: string): Promise<void>;
    get options(): Erc721ListenerOptions;
}
