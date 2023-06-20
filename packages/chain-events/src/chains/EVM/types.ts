export interface ListenerOptions {
  url: string;
  skipCatchup?: boolean;
  contractAddress: string;
}

export interface RawEvent {
  address: string;
  args: any;
  name: string;
  blockNumber: number;
  data?: any;
}
