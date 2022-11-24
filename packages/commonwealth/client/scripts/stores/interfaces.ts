export enum UpdateType {
  Add,
  Remove,
  Update,
}

export type ISerializable<T> = {
  serialize: () => T;
  deserialize: (data: T) => void;
}

export type IHasId = {
  id: string | number;
}

export type IHasAddress = {
  address: string;
}
