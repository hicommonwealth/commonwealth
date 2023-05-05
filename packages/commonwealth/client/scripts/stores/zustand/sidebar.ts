import { create, StateCreator } from 'zustand';
import { SidebarMenuName } from 'views/components/sidebar';
import { createStore } from 'zustand/vanilla';

export interface SidebarSlice {
  menuName: SidebarMenuName;
  toggled: boolean;
  toggle: (val: boolean) => void;
  setMenu: (menuName: SidebarMenuName) => void;
}

const createSidebarSlice: StateCreator<SidebarSlice, [], [], SidebarSlice> = (
  set,
) => ({
  menuName: 'default',
  toggled: false,
  toggle: (val) => set(() => ({ toggled: val })),
  setMenu: (menuName) => set(() => ({ menuName })),
});

export const sidebarStore = createStore<SidebarSlice>((...args) => ({
  ...createSidebarSlice(...args),
}));

const useSidebarStore = create(sidebarStore);

export default useSidebarStore;
