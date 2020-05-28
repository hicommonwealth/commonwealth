import IdStore from './IdStore';
import { IHasId, ISerializable } from './interfaces';

function getLocalStorageKey(prefix: string, chain: string, name: string, id: string) {
  return `${prefix}_${chain}_${name}_${id}`;
}

interface IStorageItem<T> {
  data: T;
  timestamp: number;
}

// defaults will clear all items in every PersistentStore older than 10 minutes
// this will NOT clear items from the internal stores of active PersistentStores, it ONLY
//   removes items from localStorage -- for safety, only run this function before stores are queried.
export function clearLocalStorage(prefix: string = 'cwstore', maxAge: number = 10 * 60 * 1000) {
  if (!localStorage) {
    throw new Error('cannot clear localStorage, not found!');
  }

  console.log(`Clearing localStorage of items with prefix "${prefix}", older than ${maxAge / (60 * 1000)} minutes...`);
  const now = Date.now();
  let nCleared = 0;
  const nItems = localStorage.length;
  for (let i = 0; i < nItems; ++i) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const storageItem: IStorageItem<any> = JSON.parse(localStorage.getItem(key));
      if ((now - storageItem.timestamp) > maxAge) {
        localStorage.removeItem(key);
        nCleared++;

        // decrement loop counter on remove, because the removal changes the length of the map
        --i;
      }
    }
  }
  console.log(`Viewed ${nItems} items in localStorage and cleared ${nCleared}.`);
}

// T is the object we are keeping in the store, SerializedT is a JSON.parse-able object
// that can be used to reconstruct T via the constructorFunc.
class PersistentStore<SerializedT extends IHasId, T extends IHasId & ISerializable<SerializedT>> extends IdStore<T> {
  constructor(
    public readonly chain: string,
    public readonly name: string,
    private readonly _constructorFunc: (s: SerializedT) => T,
  ) {
    super();
    if (!localStorage) {
      throw new Error('cannot create PersistentStore, localStorage not found.');
    }
  }

  private _getKey(id: string): string {
    return getLocalStorageKey('cwstore', this.chain, this.name, id);
  }

  public add(n: T) {
    super.add(n);
    const storageItem: IStorageItem<SerializedT> = { data: n.serialize(), timestamp: Date.now() };
    localStorage.setItem(this._getKey(n.id.toString()), JSON.stringify(storageItem));
    return this;
  }

  public remove(n: T) {
    super.remove(n);
    localStorage.removeItem(this._getKey(n.id.toString()));
    return this;
  }

  public update(n: T) {
    super.update(n);
    const storageItem: IStorageItem<SerializedT> = { data: n.serialize(), timestamp: Date.now() };
    localStorage.setItem(this._getKey(n.id.toString()), JSON.stringify(storageItem));
    return this;
  }

  // NOTE: does not clear localStorage entries
  public clear() {
    super.clear();
    // if we wanted to clear localStorage entries too, we could run the following:
    //   clearLocalStorage(`cwstore_${this.chain}_${this.name}`);
    // but we should evaluate the efficiency of doing so
  }

  // NOTE: will fetch from localStorage if not found in memory!
  public getById(id: number | string): T {
    const item = super.getById(id);
    if (item) return item;

    // attempt to find and revive item from localStorage, if it exists
    const localStorageItem = localStorage.getItem(this._getKey(id.toString()));
    if (localStorageItem) {
      const { data, timestamp }: IStorageItem<SerializedT> = JSON.parse(localStorageItem);
      const revivedItem: T = this._constructorFunc(data);
      this.add(revivedItem);
      return revivedItem;
    } else {
      return null;
    }
  }

  // NOTE: this will not return localStorage entries which we have not yet seen
  public getAll(): T[] {
    return this._store;
  }
}

export default PersistentStore;
