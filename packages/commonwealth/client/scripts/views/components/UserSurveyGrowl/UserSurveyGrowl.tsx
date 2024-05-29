import React, { useState } from 'react';
import useGrowlStore from 'state/ui/growl';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWGrowl } from 'views/components/component_kit/cw_growl';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './UserSurveyGrowl.scss';

const LOCALSTORAGE_USER_SURVEY_GROWL_KEY = 'userSurveyGrowlHidden';

export const UserSurveyGrowl = () => {
  const { setIsGrowlHidden, isGrowlHidden } = useGrowlStore();

  const [shouldHideGrowlPermanently, setShouldHideGrowlPermanently] =
    useState(false);

  const [isDisabled, setIsDisabled] = useState(
    localStorage.getItem(LOCALSTORAGE_USER_SURVEY_GROWL_KEY) === 'true' ||
      isGrowlHidden,
  );

  const handleExit = () => {
    setIsDisabled(true);
    setIsGrowlHidden(true);

    if (shouldHideGrowlPermanently) {
      localStorage.setItem(LOCALSTORAGE_USER_SURVEY_GROWL_KEY, 'true');
    }
  };

  return (
    <CWGrowl disabled={isDisabled} position="bottom-right">
      <div className="UserSurveyGrowl">
        <CWIconButton
          iconName="close"
          iconSize="medium"
          className="closeButton"
          onClick={handleExit}
        />
        <img
          src="/static/img/userSurveyGrowlImage.svg"
          alt=""
          className="img"
        />
        <div className="container">
          <CWText type="h2" fontWeight="bold" isCentered>
            Complete our survey and get a free NFT!
          </CWText>
          <CWText type="b1" fontWeight="medium" isCentered className="body">
            We’d like to get to know you better! Take our 2 minute audience
            survey, and we can build Common’s future together.
          </CWText>
          <CWButton
            className="CalenderButton"
            buttonType="primary"
            buttonHeight="med"
            label="Complete Survey"
            onClick={(e) => {
              e.preventDefault();
              window.open('https://bit.ly/CMNSRVY', '_blank');
            }}
          />
          <CWText type="b2" fontWeight="regular" isCentered className="body">
            Have more feedback? Reach out to us on Discord!
          </CWText>
          <a
            href="https://discord.com/channels/799041511165394986/1099034105997426709"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <CWText
              type="b1"
              fontWeight="link"
              isCentered
              className="discordLink"
            >
              Open Discord
              <CWIcon
                iconName="arrowSquareOut"
                iconSize="medium"
                className="icon"
              />
            </CWText>
          </a>
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

export default UserSurveyGrowl;
