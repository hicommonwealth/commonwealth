import { createBoundedUseStore } from 'state/ui/utils';
import { IPrivyAuthStatus } from 'views/components/PrivyMobile/types';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

type InternalState = {
  status: IPrivyAuthStatus | undefined;
};

type SMSDialogStore = InternalState & {
  setState: (state: InternalState) => void;
};

export const privyMobileAuthStatusStore = createStore<SMSDialogStore>()(
  devtools((set) => ({
    status: undefined,
    setState: (newState: InternalState) => set(newState),
  })),
);

const usePrivyMobileAuthStatusStore = createBoundedUseStore(
  privyMobileAuthStatusStore,
);

export default usePrivyMobileAuthStatusStore;
