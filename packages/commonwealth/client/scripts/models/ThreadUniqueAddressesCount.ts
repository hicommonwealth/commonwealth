import type { IUniqueId } from './interfaces';

type Addresses = {
  address_id: number;
  address: string;
  chain: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ThreadUniqueAddressesCount<T extends IUniqueId> {
  public readonly id: string;
  public readonly addresses: Addresses[];
  public readonly count: number;

  constructor(rootId, addresses, count) {
    this.id = rootId;
    this.addresses = addresses;
    this.count = count;
  }
}

export default ThreadUniqueAddressesCount;
