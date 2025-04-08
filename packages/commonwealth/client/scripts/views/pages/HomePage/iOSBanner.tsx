import React, { useState } from 'react';
import './iOSBanner.scss';
import iosBannerImage from '../../../assets/img/iosbanner.svg';

interface IOSBannerProps {
  onDismiss?: () => void;
}

const IOSBanner: React.FC<IOSBannerProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="bannerContainer" data-testid="ios-banner">
      <img
        src={iosBannerImage}
        alt="iOS App Banner Illustration"
        className="bannerImage"
        aria-hidden="true"
      />
      <div className="contentWrapper">
        <div className="textContent">
          <h2 className="title" id="ios-banner-title">
            Get the Commonwealth iOS App
          </h2>
          <p className="subtitle" id="ios-banner-description">
            Stay connected to your communities with our mobile app
          </p>
        </div>
        <div className="buttonGroup">
          <a
            href="https://apps.apple.com/us/app/commonwealth-app/id1657298714"
            target="_blank"
            rel="noopener noreferrer"
            className="downloadButton"
            aria-labelledby="ios-banner-title ios-banner-description"
            data-testid="ios-banner-download"
          >
            Download on the App Store
          </a>
          <button
            onClick={handleDismiss}
            className="dismissButton"
            aria-label="Dismiss iOS app banner"
            data-testid="ios-banner-dismiss"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default IOSBanner;
