import { CWCheckbox } from 'client/scripts/views/components/component_kit/cw_checkbox';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
// eslint-disable-next-line max-len
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line max-len
import { useSubscriptionPreferenceSettingToggle } from 'views/pages/NotificationSettings/useSubscriptionPreferenceSettingToggle';
import './NotificationModal.scss';

type NotificationModalProps = {
  onComplete: () => void;
};

/**
 * Forcibly turn on mobile notifications when the device is a new mobile
 * installation.
 *
 * Note that this should ALWAYS force the user to turn on push notifications
 * because, while the cloud settings could be enabled for the user's account,
 * they might not have permissions locally.
 *
 * Even if they DO have permissions enabled, which is probably false, we should
 * ask again.
 *
 * The only way it would not be the case is if their localStorage was reset.
 */
export const NotificationModal = ({ onComplete }: NotificationModalProps) => {
  const activate = useSubscriptionPreferenceSettingToggle([
    'mobile_push_notifications_enabled',
    'mobile_push_discussion_activity_enabled',
    'mobile_push_admin_alerts_enabled',
  ]);

  const [enableNotifications, setEnableNotification] = useState(false);

  const handleActivate = useCallback(() => {
    async function doAsync() {
      await activate(true);
      setEnableNotification(true);
    }

    doAsync().catch(console.error);
  }, [activate]);

  return (
    <section className="NotificationModal">
      <CWText type="h5" className="header" isCentered>
        Please allow access to the following permissions
      </CWText>
      <button
        className={`notificationButton ${enableNotifications ? 'enabled' : ''}`}
        onClick={() => {
          handleActivate();
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
              handleActivate();
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
