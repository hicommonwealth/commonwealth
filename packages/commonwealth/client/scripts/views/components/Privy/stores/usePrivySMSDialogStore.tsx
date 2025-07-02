import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

type OnCancel = () => void;

type OnError = (err: Error) => void;

type InternalState = {
  active: boolean;
  onCancel: OnCancel | undefined;
  onError: OnError;
  resolver?: (value: string) => void;
  rejector?: (reason?: any) => void;
};

type SMSDialogStore = InternalState & {
  setState: (state: InternalState) => void;
  awaitUserInput: (headerText?: string) => Promise<string>;
};

export const smsDialogStore = createStore<SMSDialogStore>()(
  devtools((set) => ({
    active: false,
    onCancel: undefined,
    onError: () => {},
    resolver: undefined,
    rejector: undefined,
    setState: (newState: InternalState) => set(newState),
    awaitUserInput: () => {
      return new Promise<string>((resolve, reject) => {
        set({
          active: true,
          resolver: resolve,
          rejector: reject,
          onCancel: () => {
            reject(new Error('User cancelled'));
            set({
              active: false,
              resolver: undefined,
              rejector: undefined,
              onCancel: undefined,
              onError: () => {},
            });
          },
          onError: (err: Error) => {
            reject(err);
            set({
              active: false,
              resolver: undefined,
              rejector: undefined,
              onCancel: undefined,
              onError: () => {},
            });
          },
        });
      });
    },
  })),
);

const usePrivySMSDialogStore = createBoundedUseStore(smsDialogStore);

export default usePrivySMSDialogStore;
