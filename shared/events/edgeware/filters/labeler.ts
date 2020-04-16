import { SubstrateEventType } from '../types';

export interface IEventLabel {
  label: string;
  linkUrl?: string;
}

export function labelEvent(blockNumber: number, type: SubstrateEventType, data: any): IEventLabel {
  return { label: 'TODO' };
}
