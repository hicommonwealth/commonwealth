import { createStore } from 'zustand/vanilla';
import { devtools } from 'zustand/middleware';
import { createBoundedUseStore } from 'state/ui/utils';
import { SidebarMenuName } from 'views/components/sidebar';
import { MobileMenuName } from 'views/AppMobileMenus';

interface SidebarStore {
  mobileMenuName: MobileMenuName;
  setMobileMenuName: (name: MobileMenuName) => void;
  menuName: SidebarMenuName;
  menuVisible: boolean;
  setMenu: ({
    name,
    isVisible,
  }: {
    name: SidebarMenuName;
    isVisible?: boolean;
  }) => void;
}

export const sidebarStore = createStore<SidebarStore>()(
  devtools((set) => ({
    mobileMenuName: null,
    setMobileMenuName: (name) => set(() => ({ mobileMenuName: name })),
    menuName: 'default',
    menuVisible: false,
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
