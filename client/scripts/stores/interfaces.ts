export enum UpdateType {
  Add,
  Remove,
  Update,
}

export interface ISerializable<T> {
  serialize: () => T;
}

export interface IHasId {
  id: string | number;
}

export interface IHasAddress {
  address: string;
}
