import { OffchainThread, AddressInfo } from 'models';
class RecentActivityController {
    private _store = new RecentActivityStore();

    public get store() { return this._store; }

    private _initialized = false;

    public get initialized() { return this._initialized; }

    public addThreads(threads: OffchainThread[]) {
        // TODO: Switch over to adding to store, rather than activeThreads
        const activeThreads = {};
        threads.forEach((thread) => {
            const entity = thread.community || thread.chain;
            if (activeThreads[entity]) {
              activeThreads[entity][thread.id] = thread;
            } else if (!activeThreads[entity]) {
              const addr = {};
              addr[thread.id] = thread;
              activeThreads[entity] = addr;
            }
          });
    }

    public addAddresses(addresses: AddressInfo) {

    }

    public addAddressesFromActivity(activity: any[]) {
        // TODO: Switch over to adding to store, rather than activeAddresses
        const activeAddresses = {};
        activity.sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at));
        activity.forEach((item) => {
            const entity = item.community || item.chain;
            if (activeAddresses[entity]) {
              if (activeAddresses[entity][item.address_id]) {
                activeAddresses[entity][item.address_id]['postCount'] += 1;
              } else {
                activeAddresses[entity][item.address_id] = {
                  'postCount': 1,
                  'addressInfo': [item.Address.chain, item.Address.address]
                };
              }
            } else if (!activeAddresses[entity]) {
              activeAddresses[entity] = {};
              activeAddresses[entity][item.address_id] = {
                'postCount': 1,
                'addressInfo': [item.Address.chain, item.Address.address]
              };
            }
          });
    }

    public getThreadsByCommunity(community: string) {

    }

    public getAddressesByCommunity(community: string) {
        
    }
}

export default RecentActivityController;