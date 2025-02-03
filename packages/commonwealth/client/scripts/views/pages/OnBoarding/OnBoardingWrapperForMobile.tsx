import React, { useEffect, useState } from 'react';

interface OnBoardingWrapperForMobileProps {
  children: React.ReactNode;
}
const OnBoardingWrapperForMobile = ({
  children,
}: OnBoardingWrapperForMobileProps) => {
  const [isWebView, setIsWebView] = useState(false);
  useEffect(() => {
    const isRNWebView = !!window.ReactNativeWebView;
    setIsWebView(isRNWebView);
  }, []);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (isWebView && !hasSeenOnboarding) {
      localStorage.setItem('hasSeenOnboarding', 'true');
      window.location.href = '/onboarding';
    }
  }, [isWebView]);

  return <>{children}</>;
};
export default OnBoardingWrapperForMobile;
