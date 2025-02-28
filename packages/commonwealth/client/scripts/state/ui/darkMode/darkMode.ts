import { LocalStorageKeys } from 'client/scripts/helpers/localStorage';
import { persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';

interface DarkModeState {
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
}

const updateDOMDarkMode = (isDark: boolean) => {
  const htmlElement = document.getElementsByTagName('html')[0];
  isDark
    ? htmlElement.classList.add('invert')
    : htmlElement.classList.remove('invert');
};

export const darkModeStore = createStore<DarkModeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });
        updateDOMDarkMode(isDark);
      },
      toggleDarkMode: () => {
        const newState = !get().isDarkMode;
        set({ isDarkMode: newState });
        updateDOMDarkMode(newState);
      },
    }),
    {
      name: LocalStorageKeys.DarkModeState,
    },
  ),
);

export const useDarkMode = createBoundedUseStore(darkModeStore);
