import React, { useState } from 'react';
import useGrowlStore from 'state/ui/growl';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWGrowl } from 'views/components/component_kit/cw_growl';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import './CWGrowlTemplate.scss';

const LOCALSTORAGE_GROWL_TEMPLATE_KEY = 'GrowlTemplateHidden';

interface CWGrowlTemplateProps {
  discordLink?: boolean;
  headerText: string;
  bodyText: string;
  buttonText: string;
  buttonLink: string;
  growlImage: string;
  extraText?: string;
}

//CWGrowlTemplate should be placed in Sublayout.tsx when used

export const CWGrowlTemplate = ({
  discordLink = false,
  headerText,
  bodyText,
  buttonText,
  buttonLink,
  growlImage,
  extraText,
}: CWGrowlTemplateProps) => {
  const { setIsGrowlHidden, isGrowlHidden } = useGrowlStore();

  const [shouldHideGrowlPermanently, setShouldHideGrowlPermanently] =
    useState(false);

  const [isDisabled, setIsDisabled] = useState(
    localStorage.getItem(LOCALSTORAGE_GROWL_TEMPLATE_KEY) === 'true' ||
      isGrowlHidden,
  );

  const handleExit = () => {
    setIsDisabled(true);
    setIsGrowlHidden(true);

    if (shouldHideGrowlPermanently) {
      localStorage.setItem(LOCALSTORAGE_GROWL_TEMPLATE_KEY, 'true');
    }
  };

  return (
    <CWGrowl disabled={isDisabled} position="bottom-right">
      <div className="CWGrowlTemplate">
        <CWIconButton
          iconName="close"
          iconSize="medium"
          className="closeButton"
          onClick={handleExit}
        />
        <img src={growlImage} alt="" className="img" />
        <div className="container">
          <CWText type="h2" fontWeight="bold" isCentered>
            {headerText}
          </CWText>
          <CWText type="b1" fontWeight="medium" isCentered className="body">
            {bodyText}
          </CWText>
          <CWButton
            className="CalenderButton"
            buttonType="primary"
            buttonHeight="med"
            label={buttonText}
            onClick={(e) => {
              e.preventDefault();
              window.open(buttonLink, '_blank');
            }}
          />
          {discordLink && (
            <>
              <CWText
                type="b2"
                fontWeight="regular"
                isCentered
                className="body"
              >
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
            </>
          )}
          {extraText && extraText.length > 0 && (
            <div>
              <CWText type="b2" fontWeight="medium" isCentered className="body">
                {extraText}
              </CWText>
            </div>
          )}
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

export default CWGrowlTemplate;
