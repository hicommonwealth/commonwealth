import React from 'react';
import './IOSModal.scss';

interface IOSModalProps {
  allowDisabled?: boolean;
  disallowDisabled?: boolean;

  title: string;
  description: string;

  onAllow: () => void;
  onDeny: () => void;
}
/**
 * Native-like modal for iOS ...
 */
export const IOSModal = (props: IOSModalProps) => {
  const {
    onAllow,
    onDeny,
    allowDisabled,
    disallowDisabled,
    title,
    description,
  } = props;

  return (
    <div className="IOSModal-overlay">
      <div className="IOSModal">
        <div className="IOSModal-content">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
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
