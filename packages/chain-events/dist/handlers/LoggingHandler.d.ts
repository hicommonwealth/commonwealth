import { CWEvent, IEventHandler, IChainEventData } from '../interfaces';
export declare class LoggingHandler extends IEventHandler {
    handle(event: CWEvent): Promise<IChainEventData>;
}
