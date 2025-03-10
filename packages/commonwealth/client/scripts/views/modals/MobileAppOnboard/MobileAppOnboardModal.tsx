import commonLogo from 'assets/img/branding/common-logo.svg';
import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { NotificationModal } from 'views/modals/MobileAppOnboard/NotificationModal';
import './MobileAppOnboardModal.scss';

type Props = {
  onClose: () => void;
  isOpen: boolean;
};

export const MobileAppOnboardModal = (props: Props) => {
  const { onClose, isOpen } = props;
  const { isWindowSmallInclusive } = useBrowserWindow({});

  return (
    <CWModal
      open={isOpen}
      onClose={onClose}
      size="medium"
      className={clsx('MobileAppOnboardModal')}
      isFullScreen={isWindowSmallInclusive}
      content={
        <>
          <section className="content">
            <img src={commonLogo} className="logo" />
            <CWText type="h2" className="modal-heading">
              Enable Notifications
            </CWText>
            <NotificationModal onComplete={onClose} />
          </section>
        </>
      }
    />
  );
};
