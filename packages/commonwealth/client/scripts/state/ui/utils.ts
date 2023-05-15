import { StoreApi, useStore } from 'zustand';

type ExtractState<S> = S extends { getState: () => infer X } ? X : never;

export const createBoundedUseStore = ((store) => (selector, equals) =>
  useStore(store, selector as never, equals)) as <S extends StoreApi<unknown>>(
  store: S
) => {
  (): ExtractState<S>;
  <T>(
    selector: (state: ExtractState<S>) => T,
    equals?: (a: T, b: T) => boolean
  ): T;
};
