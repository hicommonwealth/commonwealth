import { CWCheckbox } from 'client/scripts/views/components/component_kit/cw_checkbox';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
// eslint-disable-next-line max-len
import { useSubscriptionPreferenceSettingCallback } from 'client/scripts/views/pages/NotificationSettings/useSubscriptionPreferenceSettingCallback';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NotificationModal.scss';
type NotificationModalProps = {
  onComplete: () => void;
};

const NotificationModal = ({ onComplete }: NotificationModalProps) => {
  const [checked, activate] = useSubscriptionPreferenceSettingCallback(
    'mobile_push_notifications_enabled',
  );
  const [enableNotifications, setEnableNotification] = useState(checked);

  return (
    <section className="NotificationModal">
      <CWText type="h5" className="header" isCentered>
        Please allow access to the following permissions
      </CWText>
      <button
        className={`notificationButton ${enableNotifications ? 'enabled' : ''}`}
        onClick={() => {
          activate(!checked), setEnableNotification(!checked);
        }}
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
            checked={enableNotifications}
            onChange={() => {
              activate(!checked);
              setEnableNotification(!checked);
            }}
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
            label="Skip"
            buttonWidth="wide"
            containerClassName="skip-button"
            onClick={onComplete}
          />
          <CWButton
            label="Next"
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
