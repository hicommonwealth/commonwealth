import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { createBoundedUseStore } from 'state/ui/utils';
import { SidebarMenuName } from 'views/components/sidebar';
import { MobileMenuName } from 'views/AppMobileMenus';
import { isWindowSmallInclusive } from 'views/components/component_kit/helpers';
import { featureFlags } from '../../../helpers/feature-flags';

interface SidebarStore {
  mobileMenuName: MobileMenuName;
  setMobileMenuName: (name: MobileMenuName) => void;
  menuName: SidebarMenuName;
  menuVisible: boolean;
  setUserToggledVisibility: (toggled: 'open' | 'closed' | null) => void;
  userToggledVisibility: 'open' | 'closed' | null;
  recentlyUpdatedVisibility: boolean; // only set if user toggles visibility
  setRecentlyUpdatedVisibility: (updated: boolean) => void;
  setMenu: ({
    name,
    isVisible,
  }: {
    name: SidebarMenuName;
    isVisible?: boolean;
  }) => void;
}

export const sidebarStore = createStore<SidebarStore>()(
  devtools(
    persist(
      (set, get) => ({
        mobileMenuName: null,
        setMobileMenuName: (name) => set(() => ({ mobileMenuName: name })),
        menuName: 'default',
        menuVisible: true,
        userToggledVisibility:
          featureFlags.sidebarToggle === false ? 'closed' : null,
        setUserToggledVisibility: (toggled) => {
          set(() => ({ userToggledVisibility: toggled }));
          set((state) => ({
            menuVisible:
              state.userToggledVisibility === 'closed'
                ? false
                : state.userToggledVisibility === 'open'
                ? true
                : !isWindowSmallInclusive(window.innerWidth),
          }));
        },
        recentlyUpdatedVisibility: false,
        setRecentlyUpdatedVisibility: (updated) =>
          set(() => ({ recentlyUpdatedVisibility: updated })),
        setMenu: ({ name, isVisible }) =>
          set((state) => ({
            menuName: name,
            menuVisible:
              typeof isVisible === 'boolean' ? isVisible : state.menuVisible,
          })),
      }),
      {
        name: 'sidebar-store', // unique name
        partialize: (state) => ({
          userToggledVisibility: state.userToggledVisibility,
          menuVisible: state.menuVisible,
        }), // persist only userToggledVisibility and menuVisible
      }
    )
  )
);

const useSidebarStore = createBoundedUseStore(sidebarStore);

export default useSidebarStore;
