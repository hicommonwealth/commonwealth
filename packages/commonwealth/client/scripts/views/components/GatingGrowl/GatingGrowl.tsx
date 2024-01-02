import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import useGrowlStore from 'state/ui/growl/Growl';
import Persmissions from 'utils/Permissions';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWGrowl } from 'views/components/component_kit/cw_growl';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import './GatingGrowl.scss';

const LOCALSTORAGE_GATING_GROWL_KEY = 'dontShowGatingGrowlEver';

const GatingGrowl = () => {
  const navigate = useCommonNavigate();
  const { setGrowlHidden, growlHidden } = useGrowlStore();

  const [isGrowlVisible, setIsGrowlVisible] = useState(false);
  const [disabled, setIsDisabled] = useState(
    localStorage.getItem(LOCALSTORAGE_GATING_GROWL_KEY) === 'true' ||
      growlHidden,
  );
  const isAdmin = Persmissions.isCommunityAdmin();

  const handleExit = () => {
    setIsDisabled(true);

    setGrowlHidden(true);
    if (isGrowlVisible) {
      localStorage.setItem(LOCALSTORAGE_GATING_GROWL_KEY, 'true');
    }
  };

  return (
    <CWGrowl disabled={disabled} position="bottom-right">
      <div className="GatingGrowl">
        <CWIconButton
          iconName="close"
          iconSize="medium"
          className="closeButton"
          onClick={handleExit}
        />
        <img src="../../../static/img/groupGrowl.png" alt="" className="img" />
        <div className="container">
          <CWText type="h1" fontWeight="semiBold" isCentered>
            Introducing Groups
          </CWText>
          <CWText type="b1" fontWeight="regular" isCentered>
            Gate topics by token thresholds using Groups.
          </CWText>
          <CWButton
            className="latest-button"
            buttonType="primary"
            buttonHeight="med"
            label={isAdmin ? 'Create a group' : 'View groups'}
            onClick={() => {
              isAdmin
                ? navigate('/members/groups/create')
                : navigate('/members?tab=groups');
            }}
          />
          <CWText type="b2" fontWeight="regular" isCentered className="body">
            {isAdmin
              ? `Only admins can create groups.`
              : `This is an admin-only capability. Reach out to your community
      admin to set up groups.`}
          </CWText>
          <a
            href="https://blog.commonwealth.im/introducing-common-groups"
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
            onChange={() => setIsGrowlVisible(!isGrowlVisible)}
            label="Please don't show this again"
            labelClassName="checkbox"
          />
        </div>
      </div>
    </CWGrowl>
  );
};

export default GatingGrowl;
