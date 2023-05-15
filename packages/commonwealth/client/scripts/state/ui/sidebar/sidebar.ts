import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from 'state/ui/utils';
import { SidebarMenuName } from 'views/components/sidebar';
import { MobileMenuName } from 'views/AppMobileMenus';

interface SidebarStore {
  mobileMenuName: MobileMenuName;
  setMobileMenuName: (name: MobileMenuName) => void;
  menuName: SidebarMenuName;
  menuVisibility: boolean;
  setMenu: ({
    name,
    isVisible,
  }: {
    name: SidebarMenuName;
    isVisible?: boolean;
  }) => void;
}

export const sidebarStore = createStore<SidebarStore>()((set) => ({
  mobileMenuName: null,
  setMobileMenuName: (name) => set(() => ({ mobileMenuName: name })),
  menuName: 'default',
  menuVisibility: false,
  setMenu: ({ name, isVisible }) =>
    set((state) => ({
      menuName: name,
      menuVisibility:
        typeof isVisible === 'boolean' ? isVisible : state.menuVisibility,
    })),
}));

const useSidebarStore = createBoundedUseStore(sidebarStore);

export default useSidebarStore;
