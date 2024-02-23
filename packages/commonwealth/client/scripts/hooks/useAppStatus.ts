const useAppStatus = () => {
  const isAddedToHomeScreen = window.matchMedia(
    '(display-mode: standalone)',
  ).matches;
  const isMarketingPage = window.location.pathname === '/';
  const isIOS = window.navigator.userAgent.match(/(iPad|iPhone|iPod)/g)
    ? true
    : false;
  const isAndroid = window.navigator.userAgent.match(/Android/g) ? true : false;

  return {
    isAddedToHomeScreen,
    isMarketingPage,
    isIOS,
    isAndroid,
  };
};

export default useAppStatus;
