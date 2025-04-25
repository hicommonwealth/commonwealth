import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

type OnCancel = () => void;

interface SMSDialogStore {
  phoneNumber: string | undefined;
  loading: boolean;
  onCancel: OnCancel | undefined;
  setState: (
    phoneNumber: string | undefined,
    loading: boolean,
    onCancel: OnCancel | undefined,
  ) => void;
}

export const smsDialogStore = createStore<SMSDialogStore>()(
  devtools((set) => ({
    phoneNumber: undefined,
    loading: false,
    onCancel: () => {},
    setState: (phoneNumber, loading, onCancel) =>
      set({ phoneNumber, loading, onCancel }),
  })),
);

const useSMSDialogStore = createBoundedUseStore(smsDialogStore);

export default useSMSDialogStore;
