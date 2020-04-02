export enum UpdateType {
  Add,
  Remove,
  Update,
}

export interface IStoreUpdate<T> {
  item: T;
  updateType: UpdateType;
}

export interface IHasId {
  id: string | number;
}

export interface IHasAddress {
  address: string;
}
