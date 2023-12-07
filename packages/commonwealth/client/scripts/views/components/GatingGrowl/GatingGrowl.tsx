import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import Persmissions from 'utils/Permissions';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWGrowl } from 'views/components/component_kit/cw_growl';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import './GatingGrowl.scss';

const setShowGatingGrowl = 'dontShowGatingGrowlEver';

const tempHideGatingGrowl = 'tempHideGatingGrowl';

const GatingGrowl = () => {
  const navigate = useCommonNavigate();

  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [disabled, setIsDisabled] = useState(
    localStorage.getItem(setShowGatingGrowl) === 'true' ||
      localStorage.getItem(tempHideGatingGrowl) === 'true',
  );
  const isAdmin = Persmissions.isCommunityAdmin();

  const handleExit = () => {
    setIsDisabled(true);

    localStorage.setItem(tempHideGatingGrowl, 'true');
    if (dontShowAgain) {
      localStorage.setItem(setShowGatingGrowl, 'true');
    }
  };

  useEffect(() => {
    const detectRefresh = () => {
      const navigationEntries =
        window.performance.getEntriesByType('navigation');

      if (navigationEntries.length > 0) {
        const firstEventArr = navigationEntries[0];

        if ('type' in firstEventArr && firstEventArr.type === 'reload') {
          localStorage.setItem(tempHideGatingGrowl, 'false');
        }
      }
    };

    window.addEventListener('beforeunload', detectRefresh);

    return () => {
      window.removeEventListener('beforeunload', detectRefresh);
    };
  }, []);

  return (
    <CWGrowl disabled={disabled} position="bottom-right">
      <div className="GatingGrowl">
        <CWIconButton
          iconName="close"
          iconSize="medium"
          className="closeButton"
          onClick={handleExit}
        />
        <img src="../../static/img/groupGrowl.png" alt="" className="img" />
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
              This is an admin-only capability. Reach out to your community
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
          <CWCheckbox
            onChange={() => setDontShowAgain(!dontShowAgain)}
            label="Please don't show this again"
            labelClassName="checkbox"
          />
        </div>
      </div>
    </CWGrowl>
  );
};

export default GatingGrowl;
