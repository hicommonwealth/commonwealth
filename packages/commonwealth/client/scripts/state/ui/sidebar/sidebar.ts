import { createStore } from 'zustand/vanilla';
import { devtools } from 'zustand/middleware';
import { createBoundedUseStore } from 'state/ui/utils';
import { SidebarMenuName } from 'views/components/sidebar';
import { MobileMenuName } from 'views/AppMobileMenus';
import { isWindowSmallInclusive } from 'views/components/component_kit/helpers';

interface SidebarStore {
  mobileMenuName: MobileMenuName;
  setMobileMenuName: (name: MobileMenuName) => void;
  menuName: SidebarMenuName;
  menuVisible: boolean;
  setUserToggledVisibility: (toggled: 'open' | 'closed' | null) => void;
  userToggledVisibility: 'open' | 'closed' | null;
  setMenu: ({
    name,
    isVisible,
  }: {
    name: SidebarMenuName;
    isVisible?: boolean;
  }) => void;
}

const setUserSidebarVisibility = (state: 'open' | 'closed' | null) => {
  if (state) {
    localStorage.setItem('user-sidebar-visibility', state);
  } else {
    localStorage.removeItem('user-sidebar-visibility');
  }
};

const userSidebarPreference = localStorage.getItem('user-sidebar-visibility');

const initialMenuVisible =
  userSidebarPreference === 'closed'
    ? false
    : userSidebarPreference === 'open'
    ? true
    : !isWindowSmallInclusive(window.innerWidth);

export const sidebarStore = createStore<SidebarStore>()(
  devtools((set) => ({
    mobileMenuName: null,
    setMobileMenuName: (name) => set(() => ({ mobileMenuName: name })),
    menuName: 'default',
    menuVisible: initialMenuVisible,
    userToggledVisibility: userSidebarPreference as 'open' | 'closed' | null,
    setUserToggledVisibility: (toggled) => {
      set(() => ({ userToggledVisibility: toggled }));
      setUserSidebarVisibility(toggled);
    },
    setMenu: ({ name, isVisible }) =>
      set((state) => ({
        menuName: name,
        menuVisible:
          typeof isVisible === 'boolean' ? isVisible : state.menuVisible,
      })),
  }))
);

const useSidebarStore = createBoundedUseStore(sidebarStore);

export default useSidebarStore;
