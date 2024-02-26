import { expect } from 'chai';
import { sidebarStore } from 'state/ui/sidebar';

describe('sidebar store', () => {
  const initialStore = sidebarStore.getState();

  beforeEach(() => {
    sidebarStore.setState(initialStore);
  });

  describe('sidebar menu', () => {
    it('should set menuName and menuVisible', () => {
      sidebarStore
        .getState()
        .setMenu({ name: 'exploreCommunities', isVisible: true });
      expect(sidebarStore.getState().menuName).to.equal('exploreCommunities');
      expect(sidebarStore.getState().menuVisible).to.be.true;
    });

    it('should retain menuVisible if isVisible is not provided', () => {
      const previousVisibility = sidebarStore.getState().menuVisible;
      sidebarStore.getState().setMenu({ name: 'createContent' });
      expect(sidebarStore.getState().menuVisible).to.equal(previousVisibility);
    });
  });
});
