import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { LocalAISettingsStore } from '../user/localAISettings';
import { createBoundedUseStore } from '../utils';

export type StickyInputMode = 'thread' | 'comment';

interface StickyInputState {
  // Content state
  inputValue: string;
  expanded: boolean;
  mode: StickyInputMode;

  // Flags to prevent circular updates
  isUpdatingFromInput: boolean;
  isUpdatingFromEditor: boolean;

  // Actions
  setInputValue: (value: string, source: 'input' | 'editor') => void;
  setExpanded: (expanded: boolean) => void;
  resetContent: () => void;
  setMode: (mode: StickyInputMode) => void;
  toggleAiAutoReply: () => void;
  // New action to reset the entire state when routes change
  resetState: () => void;
}

export const stickyInputStore = createStore<StickyInputState>()(
  devtools(
    (set) => ({
      // Initial state
      inputValue: '',
      expanded: false,
      mode: 'thread' as StickyInputMode,
      isUpdatingFromInput: false,
      isUpdatingFromEditor: false,

      // Actions
      setInputValue: (value, source) => {
        set((state) => {
          // Prevent circular updates by checking the source and current update flags
          if (source === 'input' && state.isUpdatingFromEditor) {
            return state;
          }
          if (source === 'editor' && state.isUpdatingFromInput) {
            return state;
          }

          return {
            inputValue: value,
            isUpdatingFromInput: source === 'input',
            isUpdatingFromEditor: source === 'editor',
          };
        });

        // Reset the flags after a short delay to allow the update to propagate
        setTimeout(() => {
          set({ isUpdatingFromInput: false, isUpdatingFromEditor: false });
        }, 50);
      },

      setExpanded: (expanded) => set({ expanded }),

      resetContent: () =>
        set({
          inputValue: '',
          isUpdatingFromInput: false,
          isUpdatingFromEditor: false,
        }),

      setMode: (mode) => set({ mode }),

      toggleAiAutoReply: () => {
        const { aiCommentsToggleEnabled, setAICommentsToggleEnabled } =
          LocalAISettingsStore.getState();
        setAICommentsToggleEnabled(!aiCommentsToggleEnabled);
      },

      // Complete reset for route changes
      resetState: () =>
        set({
          inputValue: '',
          expanded: false,
          isUpdatingFromInput: false,
          isUpdatingFromEditor: false,
        }),
    }),
    { name: 'sticky-input-store' },
  ),
);

const useStickyInputStore = createBoundedUseStore(stickyInputStore);

export { useStickyInputStore };
export default useStickyInputStore;
