import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import Persmissions from 'utils/Permissions';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWGrowl } from 'views/components/component_kit/cw_growl';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import './GatingGrowl.scss';
import { GatingImg } from './GatingGrowlImg';

const GatingGrowl = () => {
  const navigate = useCommonNavigate();

  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const [disabled, setIsDisabled] = React.useState(
    localStorage.getItem('dontShowGatingGrowl') === 'true',
  );
  const isAdmin = Persmissions.isCommunityAdmin();

  const handleExit = () => {
    setIsDisabled(true);
    if (dontShowAgain) {
      localStorage.setItem('dontShowGatingGrowl', 'true');
    }
  };

  return (
    <CWGrowl disabled={disabled} position="bottom-right">
      <div className="GatingGrowl">
        <div onClick={handleExit}>
          <GatingImg />
        </div>
        <div className="container">
          <CWText type="h1" fontWeight="semiBold" isCentered>
            Introducing Groups
          </CWText>
          <CWText type="b1" fontWeight="regular" isCentered>
            Gate topics by token threasholds using Groups.
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
          {isAdmin ? (
            <CWText type="b2" fontWeight="regular" isCentered className="body">
              Only admins can create groups.
            </CWText>
          ) : (
            <CWText type="b2" fontWeight="regular" isCentered className="body">
              This is an admin-only capability. Reach out to your communuity
              admin to set up groups.
            </CWText>
          )}
          <CWText
            type="b1"
            fontWeight="link"
            isCentered
            className="learnMore"
            onClick={() =>
              window.open(
                'https://blog.commonwealth.im/introducing-common-groups',
                '_blank',
              )
            }
          >
            Learn More
            <CWIcon
              iconName="arrowSquareOut"
              iconSize="medium"
              className="icon"
            />
          </CWText>
        </div>
        <div className="checkboxContainer">
          <CWCheckbox onChange={() => setDontShowAgain(!dontShowAgain)} />
          <CWText
            type="buttonSm"
            fontWeight="regular"
            className="checkboxText"
            isCentered
          >
            {`Please don't show this again`}
          </CWText>
        </div>
      </div>
    </CWGrowl>
  );
};

export default GatingGrowl;
