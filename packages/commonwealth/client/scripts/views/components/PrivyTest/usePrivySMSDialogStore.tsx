import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface SMSDialogStore {
  phoneNumber: string | undefined;
  setPhoneNumber: (phoneNumber: string | undefined) => void;
}

export const smsDialogStore = createStore<SMSDialogStore>()(
  devtools((set) => ({
    phoneNumber: undefined,
    setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
  })),
);

const useSMSDialogStore = createBoundedUseStore(smsDialogStore);

export default useSMSDialogStore;
