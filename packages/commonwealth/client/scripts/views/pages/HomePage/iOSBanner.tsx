import React, { useState } from 'react';
import './iOSBanner.scss';
import iOSBannerImage from './iosbanner.svg';

interface IOSBannerProps {
  onDismiss?: () => void;
}

export const IOSBanner: React.FC<IOSBannerProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="bannerContainer">
      <div className="contentWrapper">
        <div className="textContent">
          <h1 className="title">Download Common from the App Store</h1>
          <p className="subtitle">Engage, earn, and participate all on mobile.</p>
        </div>
        <div className="buttonGroup">
          <a 
            href="https://apps.apple.com/us/app/common-launch-trade-earn/id6739505409"
            target="_blank"
            rel="noopener noreferrer"
            className="downloadButton"
          >
            Download on iOS
          </a>
          <button 
            onClick={handleDismiss}
            className="dismissButton"
          >
            Dismiss
          </button>
        </div>
      </div>
      <img 
        src={iOSBannerImage}
        alt="Download Common App"
        className="bannerImage"
      />
    </div>
  );
};

export default IOSBanner;
