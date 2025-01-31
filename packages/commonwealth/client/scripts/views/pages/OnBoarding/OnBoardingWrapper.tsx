import React, { useEffect, useState } from 'react';

interface OnBoardingWrapperProps {
  children: React.ReactNode;
}
const OnBoardingWrapper = ({ children }: OnBoardingWrapperProps) => {
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
export default OnBoardingWrapper;
