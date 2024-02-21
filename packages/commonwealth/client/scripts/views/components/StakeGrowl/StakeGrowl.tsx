import React, { useState } from 'react';
import useGrowlStore from 'state/ui/growl';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWGrowl } from 'views/components/component_kit/cw_growl';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/cw_button';
import './StakeGrowl.scss';

const LOCALSTORAGE_STAKE_GROWL_KEY = 'stakeGrowlHidden';

const StakeGrowl = () => {
  const { setIsGrowlHidden, isGrowlHidden } = useGrowlStore();

  const [shouldHideGrowlPermanently, setShouldHideGrowlPermanently] =
    useState(false);
  const [isDisabled, setIsDisabled] = useState(
    localStorage.getItem(LOCALSTORAGE_STAKE_GROWL_KEY) === 'true' ||
      isGrowlHidden,
  );

  const handleExit = () => {
    setIsDisabled(true);
    setIsGrowlHidden(true);

    if (shouldHideGrowlPermanently) {
      localStorage.setItem(LOCALSTORAGE_STAKE_GROWL_KEY, 'true');
    }
  };

  return (
    <CWGrowl disabled={isDisabled} position="bottom-right">
      <div className="StakeGrowl">
        <CWIconButton
          iconName="close"
          iconSize="medium"
          className="closeButton"
          onClick={handleExit}
        />
        <img src="/static/img/stakingGrowlImg.png" alt="" className="img" />
        <div className="container">
          <CWText type="h2" fontWeight="bold" isCentered>
            Introducing Community Stake
          </CWText>
          <CWText type="b1" fontWeight="medium" isCentered className="body">
            Empower members with onchain ownership, gated access, and enhanced
            voting power with Community Stake
          </CWText>
          <CWButton
            className="CalenderButton"
            buttonType="primary"
            buttonHeight="med"
            label="Create community with stake"
            onClick={() =>
              (window.location.href = `${window.location.protocol}//${window.location.host}/createCommunity`)
            }
          />
          <CWText type="b2" fontWeight="regular" isCentered className="body">
            Currently only newly creted communities can enable stake.
          </CWText>
          <a
            href="http://blog.commonwealth.im/community-stake-100-owners-around-any-idea/"
            target="_blank"
            rel="noreferrer"
          >
            <CWText
              type="b1"
              fontWeight="link"
              isCentered
              className="learnMore"
            >
              Learn More
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

export default StakeGrowl;
