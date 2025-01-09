import { CWCheckbox } from 'client/scripts/views/components/component_kit/cw_checkbox';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NotificationModa.scss';
type NotificationModalProps = {
  onComplete: () => void;
};

const NotificationModal = ({ onComplete }: NotificationModalProps) => {
  const [enableNotification, setEnableNotification] = useState(false);
  const handleNotificationCheck = () => {
    setEnableNotification(!enableNotification);
    if (enableNotification) {
      window?.ReactNativeWebView?.postMessage('Permission');
    }
  };
  return (
    <section className="NotificationModal">
      <CWText type="h5" className="header" isCentered>
        {'Please allow access to the following permissions.'}
      </CWText>
      <button
        className={`notificationButton ${enableNotification ? 'enabled' : ''}`}
        onClick={handleNotificationCheck}
      >
        <CWIcon iconSize="large" iconName="bellRinging" />

        <div className="info">
          <div className="container">
            <CWText type="h5" className="label">
              Notifications
            </CWText>
            <CWText type="h5" className="description">
              Tap to enable
            </CWText>
          </div>

          <CWCheckbox
            checked={enableNotification}
            onChange={handleNotificationCheck} // Handle checkbox changes
          />
        </div>
      </button>

      <div className="footerContainer">
        <CWText isCentered className="footer">
          We will never share your contact information with third-party
          services.
          <br />
          For questions, please review our&nbsp;
          <Link to="/privacy">Privacy Policy</Link>
        </CWText>
        <div className="buttons_container">
          <CWButton
            label={'Skip'}
            buttonWidth="wide"
            containerClassName="skip-button"
            onClick={onComplete}
          />
          <CWButton
            label={'Next'}
            buttonWidth="wide"
            onClick={onComplete}
            containerClassName="next-button"
          />
        </div>
      </div>
    </section>
  );
};

export { NotificationModal };
