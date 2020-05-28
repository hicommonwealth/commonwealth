abstract class Store<T> {
  protected _store: T[] = [];

  public add(item: T): Store<T> {
    this._store.push(item);
    return this;
  }

  public remove(item: T): Store<T> {
    const index = this._store.indexOf(item);
    if (index === -1) {
      console.error('Attempting to remove an object that was not found in the store');
      return this;
    }
    this._store.splice(index, 1);
    return this;
  }

  public clear() {
    this._store = [];
  }

  public getAll(): T[] {
    return this._store;
  }
}

export default Store;
