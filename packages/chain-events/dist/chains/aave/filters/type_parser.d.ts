import { EventKind } from '../types';
/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export declare function ParseType(name: string, chain?: string): EventKind | null;
