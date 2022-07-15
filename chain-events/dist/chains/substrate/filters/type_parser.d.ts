import { EventKind } from '../types';
/**
 * This is the Type Parser function, which takes a raw Substrate chain Event
 * and determines which of our local event kinds it belongs to.
 */
export declare function ParseType(versionName: string, versionNumber: number, section: string, method: string): EventKind | null;
