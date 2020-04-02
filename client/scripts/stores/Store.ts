// TODO: we can make this even better if we have T implement a StoreKey mixin,
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IStoreUpdate, UpdateType } from './interfaces';

// then we can look up items by key, prevent duplicates from being inserted, etc
abstract class Store<T> {
  protected _store: T[] = [];

  private _subject: BehaviorSubject<IStoreUpdate<T> | null> = new BehaviorSubject(null);

  public add(item: T): Store<T> {
    this._store.push(item);
    this._subject.next({ item, updateType: UpdateType.Add });
    return this;
  }

  public remove(item: T): Store<T> {
    const index = this._store.indexOf(item);
    if (index === -1) {
      console.error('Attempting to remove an object that was not found in the store');
      return this;
    }
    this._store.splice(index, 1);
    this._subject.next({ item, updateType: UpdateType.Remove });
    return this;
  }

  public update(item: T): Store<T> {
    this._subject.next({ item, updateType: UpdateType.Update });
    return this;
  }

  public clear() {
    this._store = [];
    this._subject = new BehaviorSubject(null);
  }

  public getAll(): T[] {
    return this._store;
  }

  public getObservable(): Observable<IStoreUpdate<T>> {
    return this._subject.asObservable().pipe(filter((s) => s !== null));
  }
}

export default Store;
