import React from 'react';
import './IOSModal.scss';

interface IOSModalProps {
  allowDisabled?: boolean;
  disallowDisabled?: boolean;

  onAllow: () => void;
  onDeny: () => void;
}
/**
 * Native-like modal for iOS ...
 */
export const IOSModal = (props: IOSModalProps) => {
  const { onAllow, onDeny, allowDisabled, disallowDisabled } = props;

  return (
    <div className="IOSModal-overlay">
      <div className="IOSModal">
        <h2>“Common” Would Like to Send You Notifications</h2>
        <p>
          Notifications may include alerts, sounds, and icon badges. These can
          be configured in Settings.
        </p>
        <div className="IOSModal-buttons">
          <button disabled={disallowDisabled} onClick={onDeny}>
            Don’t Allow
          </button>
          <button disabled={allowDisabled} onClick={onAllow}>
            Allow
          </button>
        </div>
      </div>
    </div>
  );
};
