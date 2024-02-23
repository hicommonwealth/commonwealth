import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { useCallback, useMemo } from 'react';
import { sidebarStore } from 'state/ui/sidebar';
import { isWindowSmallInclusive } from '../component_kit/helpers';
import { verifyCachedToggleTree } from './helpers';

type SidebarTreeToggleProps = {
  treeName: string;
  localStorageKey: string;
};

const resetSidebarState = () => {
  if (isWindowSmallInclusive(window.innerWidth)) {
    sidebarStore.getState().setMenu({ name: 'default', isVisible: false });
  } else {
    sidebarStore.getState().setMenu({ name: 'default', isVisible: true });
  }
};

const defaultToggleTreeState = {
  toggledState: false,
  children: {},
};

const useSidebarTreeToggle = ({
  treeName,
  localStorageKey,
}: SidebarTreeToggleProps) => {
  const toggledTreeState = useMemo(
    () => JSON.parse(localStorage[localStorageKey] || `{}`),
    [localStorageKey],
  );

  const setToggleTree = useCallback(
    (path: string, toggle: boolean) => {
      let currentTree = JSON.parse(localStorage[localStorageKey]);

      const split = path.split('.');

      for (const field of split.slice(0, split.length - 1)) {
        if (Object.prototype.hasOwnProperty.call(currentTree, field)) {
          currentTree = currentTree[field];
        } else {
          return;
        }
      }

      currentTree[split[split.length - 1]] = !toggle;

      const newTree = currentTree;

      localStorage[localStorageKey] = JSON.stringify(newTree);
    },
    [localStorageKey],
  );

  useNecessaryEffect(() => {
    // Check if an existing toggle tree is stored
    if (!localStorage[localStorageKey]) {
      localStorage[localStorageKey] = JSON.stringify(defaultToggleTreeState);
    } else if (!verifyCachedToggleTree(treeName, defaultToggleTreeState)) {
      localStorage[localStorageKey] = JSON.stringify(defaultToggleTreeState);
    }
  }, [localStorageKey, defaultToggleTreeState, treeName]);

  return {
    resetSidebarState,
    setToggleTree,
    toggledTreeState,
  };
};

export { useSidebarTreeToggle };
