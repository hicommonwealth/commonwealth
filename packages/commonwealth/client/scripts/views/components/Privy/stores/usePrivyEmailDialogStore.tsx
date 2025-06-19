import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

type OnCancel = () => void;

type OnError = (err: Error) => void;

type InternalState = {
  active: boolean;
  onCancel: OnCancel | undefined;
  onError: OnError;
};

type SMSDialogStore = InternalState & {
  setState: (state: InternalState) => void;
};

export const smsDialogStore = createStore<SMSDialogStore>()(
  devtools((set) => ({
    active: false,
    onCancel: undefined,
    onError: () => {},
    setState: (newState: InternalState) => set(newState),
  })),
);

const usePrivySMSDialogStore = createBoundedUseStore(smsDialogStore);

export default usePrivySMSDialogStore;
