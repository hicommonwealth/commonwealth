abstract class Store<T> {
  protected _store: T[] = [];

  public add(
    item: T,
    options?: { eqFn?: (a: T) => boolean; pushToIndex?: number }
  ): Store<T> {
    // public add(item: T, eqFn?: (a: T) => boolean): Store<T> {
    const index =
      options && options.eqFn
        ? this._store.findIndex(options.eqFn)
        : this._store.indexOf(item);

    // Only add unique elements to store
    if (index === -1) {
      options && options.pushToIndex >= 0
        ? this._store.splice(options.pushToIndex, 0, item)
        : this._store.push(item);
    } else {
      // if the item is a class instance (e.g. Proposals) this serializes it into an object
      this._store[index] = { ...item };
    }

    return this;
  }

  public remove(item: T, eqFn?: (a: T) => boolean): Store<T> {
    const index = eqFn
      ? this._store.findIndex(eqFn)
      : this._store.indexOf(item);
    if (index === -1) {
      console.log(
        'Attempting to remove an object that was not found in the store'
      );
      return this;
    }
    this._store.splice(index, 1);
    return this;
  }

  public update(item: T, eqFn?: (a: T) => boolean): Store<T> {
    const index = eqFn
      ? this._store.findIndex(eqFn)
      : this._store.indexOf(item);
    if (index === -1) {
      console.error(
        'Attempting to update an object that was not found in the store'
      );
      return this;
    }
    this._store[index] = item;
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
