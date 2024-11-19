import { sidebarStore } from 'state/ui/sidebar';
import { beforeEach, describe, expect, test } from 'vitest';

describe('sidebar store', () => {
  const initialStore = sidebarStore.getState();

  beforeEach(() => {
    sidebarStore.setState(initialStore);
  });

  describe('sidebar menu', () => {
    test('should set menuName and menuVisible', () => {
      sidebarStore
        .getState()
        .setMenu({ name: 'exploreCommunities', isVisible: true });
      expect(sidebarStore.getState().menuName).to.equal('exploreCommunities');
      expect(sidebarStore.getState().menuVisible).to.be.true;
    });

    test('should retain menuVisible if isVisible is not provided', () => {
      const previousVisibility = sidebarStore.getState().menuVisible;
      sidebarStore.getState().setMenu({ name: 'createContent' });
      expect(sidebarStore.getState().menuVisible).to.equal(previousVisibility);
    });
  });
});
