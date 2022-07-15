import { CWEvent, IEventHandler } from '../interfaces';
export declare class httpPostHandler implements IEventHandler {
    readonly url: any;
    constructor(url: any);
    handle(event: CWEvent): Promise<any>;
}
