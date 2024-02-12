import React, { useState } from 'react';
import useGrowlStore from 'state/ui/growl';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWGrowl } from 'views/components/component_kit/cw_growl';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/cw_button';
import './ValentineGrowl.scss';

const LOCALSTORAGE_VALENTINE_GROWL_KEY = 'valentineGrowlHidden';

const ValentineGrowl = () => {
  const { setIsGrowlHidden, isGrowlHidden } = useGrowlStore();

  const [shouldHideGrowlPermanently, setShouldHideGrowlPermanently] =
    useState(false);
  const [isDisabled, setIsDisabled] = useState(
    localStorage.getItem(LOCALSTORAGE_VALENTINE_GROWL_KEY) === 'true' ||
      isGrowlHidden,
  );

  const openInviteInCalender = () => {
    const link = document.createElement('a');
    link.href = `webcal://${window.location.host}/static/invites/common-community-call.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExit = () => {
    setIsDisabled(true);
    setIsGrowlHidden(true);

    if (shouldHideGrowlPermanently) {
      localStorage.setItem(LOCALSTORAGE_VALENTINE_GROWL_KEY, 'true');
    }
  };

  return (
    <CWGrowl disabled={isDisabled} position="bottom-right">
      <div className="ValentineGrowl">
        <CWIconButton
          iconName="close"
          iconSize="medium"
          className="closeButton"
          onClick={handleExit}
        />
        <img
          src="/static/img/valentineGrowlImage.jpeg"
          alt=""
          className="img"
        />
        <div className="container">
          <CWText type="h1" fontWeight="semiBold" isCentered>
            Join the community call
          </CWText>
          <CWText
            type="b1"
            fontWeight="regular"
            isCentered
            className="subtitle-text"
          >
            and receive a POAP 🎁
          </CWText>
          <CWText type="b2" fontWeight="regular" isCentered className="body">
            Get ready for an exclusive announcement from Common!
            <br />
            Join us on February 14th at 11am EST for something special just for
            you!
          </CWText>
          <CWButton
            className="CalenderButton"
            buttonType="primary"
            buttonHeight="med"
            label="Add to calendar"
            onClick={openInviteInCalender}
          />
        </div>
        <div className="checkboxContainer">
          <CWCheckbox
            onChange={() =>
              setShouldHideGrowlPermanently(!shouldHideGrowlPermanently)
            }
            label="Please don't show this again"
            labelClassName="checkbox"
          />
        </div>
      </div>
    </CWGrowl>
  );
};

export default ValentineGrowl;
