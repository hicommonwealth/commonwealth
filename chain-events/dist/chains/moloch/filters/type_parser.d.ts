import { EventKind } from '../types';
/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export declare function ParseType(version: 1 | 2, name: string, chain?: string): EventKind | null;
