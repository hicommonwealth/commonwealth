const useAppStatus = () => {
  const isAddedToHomeScreen = window.matchMedia(
    '(display-mode: standalone)',
  ).matches;
  const isMarketingPage = window.location.pathname === '/';
  const isIOS =
    !!window.navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const isAndroid = window.navigator.userAgent.match(/Android/g) ? true : false;

  return {
    isAddedToHomeScreen,
    isMarketingPage,
    isIOS,
    isAndroid,
  };
};

export default useAppStatus;
