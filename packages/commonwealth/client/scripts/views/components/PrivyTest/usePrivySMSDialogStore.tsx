import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

type OnCancel = () => void;

type InternalState = {
  active: boolean;
  onCancel: OnCancel | undefined;
};

type SMSDialogStore = InternalState & {
  setState: (state: InternalState) => void;
};

export const smsDialogStore = createStore<SMSDialogStore>()(
  devtools((set) => ({
    active: false,
    onCancel: () => {},
    setState: (newState: InternalState) => set(newState),
  })),
);

const useSMSDialogStore = createBoundedUseStore(smsDialogStore);

export default useSMSDialogStore;
