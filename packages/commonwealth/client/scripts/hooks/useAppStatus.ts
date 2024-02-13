import React from 'react';

const useAppStatus = () => {
  const [isAddedToHomeScreen, setIsAddedToHomeScreen] = React.useState(true);
  const [isStandalone, setIsStandalone] = React.useState(true);
  const [isMarketingPage, setIsMarketingPage] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isAndroid, setIsAndroid] = React.useState(false);

  React.useEffect(() => {
    setIsStandalone(
      process.env.NEXT_PUBLIC_ONLY_STANDALONE === 'true' ? true : false,
    );
    setIsAddedToHomeScreen(
      window.matchMedia('(display-mode: standalone)').matches,
    );
    setIsIOS(
      window.navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false,
    );
    setIsAndroid(window.navigator.userAgent.match(/Android/g) ? true : false);
    setIsMarketingPage(window.location.pathname === '/');
  }, []);

  return {
    isAddedToHomeScreen,
    isStandalone,
    isMarketingPage,
    isIOS,
    isAndroid,
  };
};

export default useAppStatus;
