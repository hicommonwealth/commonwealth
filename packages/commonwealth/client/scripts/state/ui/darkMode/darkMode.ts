import { LocalStorageKeys } from 'client/scripts/helpers/localStorage';
import { persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';

type StateUpdateOptions = {
  noPersist?: boolean;
};
interface DarkModeState {
  isDarkMode: boolean;
  reCalculateDarkMode: () => void;
  setDarkMode: (isDark: boolean, options?: StateUpdateOptions) => void;
  toggleDarkMode: (options?: StateUpdateOptions) => void;
}

const calculateInitialDarkMode = (): boolean => {
  // ensure the scripts are loaded, else use light mode
  if (typeof window === 'undefined') return false;

  // check if preferred by system
  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) return prefersDark;

  // check if enforced by existing state
  const existingState = localStorage.getItem(LocalStorageKeys.DarkModeState);
  try {
    const parsed = JSON.parse(existingState || '{}');
    if (parsed?.state?.isDarkMode) return true;
  } catch {
    // do nothing
  }

  // use light mode
  return false;
};

const updateDOMDarkMode = (isDark: boolean) => {
  const htmlElement = document.getElementsByTagName('html')[0];
  isDark
    ? htmlElement.classList.add('invert')
    : htmlElement.classList.remove('invert');
};

export const darkModeStore = createStore<DarkModeState>()(
  persist(
    (set, get, api) => {
      // custom func to bypasses persistence
      const customSet = (
        partial: Partial<DarkModeState>,
        noPersist?: boolean,
      ) => {
        if (noPersist) {
          api.setState(partial, true); // just update state without persistance
        } else {
          set(partial);
        }
      };

      return {
        isDarkMode: calculateInitialDarkMode(),
        reCalculateDarkMode: () => {
          set({
            isDarkMode: calculateInitialDarkMode(),
          });
        },
        setDarkMode: (isDark, options?: StateUpdateOptions) => {
          console.log('options?.noPersist => ', options?.noPersist);
          customSet({ isDarkMode: isDark }, !!options?.noPersist);
          updateDOMDarkMode(isDark);
        },
        toggleDarkMode: (options?: StateUpdateOptions) => {
          const newState = !get().isDarkMode;
          customSet({ isDarkMode: newState }, !!options?.noPersist);
          updateDOMDarkMode(newState);
        },
      };
    },
    {
      name: LocalStorageKeys.DarkModeState,
      onRehydrateStorage: () => (state) => {
        const value = state?.isDarkMode ?? calculateInitialDarkMode();
        updateDOMDarkMode(value);
      },
    },
  ),
);

export const useDarkMode = createBoundedUseStore(darkModeStore);
