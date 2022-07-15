import { CWEvent } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { EventKind, IErc20Contracts, ListenerOptions as Erc20ListenerOptions, RawEvent } from './types';
import { Processor } from './processor';
import { Subscriber } from './subscriber';
import { EnricherConfig } from './filters/enricher';
export declare class Listener extends BaseListener<IErc20Contracts, never, Processor, Subscriber, EventKind> {
    private readonly _options;
    protected readonly log: any;
    constructor(chain: string, tokenAddresses: string[], url?: string, tokenNames?: string[], enricherConfig?: EnricherConfig, verbose?: boolean);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    protected handleEvent(event: CWEvent): Promise<void>;
    protected processBlock(event: RawEvent, tokenName?: string): Promise<void>;
    get options(): Erc20ListenerOptions;
}
