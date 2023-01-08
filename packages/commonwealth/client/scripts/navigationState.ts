import chainState from 'chainState';

export interface INavState {
  activeChainId: () => string;
  serverUrl: () => string;
  _customDomainId: string;
  isCustomDomain: () => boolean;
  customDomainId: () => string;
  setCustomDomain: (d: string) => void;
  _lastNavigatedBack: boolean;
  _lastNavigatedFrom: string;
  lastNavigatedBack: () => boolean;
  lastNavigatedFrom: () => string;
  mobileMenu: string;
  sidebarMenu: string;
  sidebarToggled: boolean;
}

const navState: INavState = {
  activeChainId: () => chainState.chain?.id,

  serverUrl: () => '/api',

  _customDomainId: null,
  isCustomDomain: () => navState._customDomainId !== null,
  customDomainId: () => {
    return navState._customDomainId;
  },
  setCustomDomain: (d) => {
    navState._customDomainId = d;
  },

  _lastNavigatedFrom: null,
  _lastNavigatedBack: false,
  lastNavigatedBack: () => navState._lastNavigatedBack,
  lastNavigatedFrom: () => navState._lastNavigatedFrom,

    // Global nav state
  mobileMenu: null,
  sidebarMenu: 'default',
  sidebarToggled: false,
};

export default navState;