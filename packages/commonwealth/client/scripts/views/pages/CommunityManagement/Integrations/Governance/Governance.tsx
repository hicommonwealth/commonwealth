import { useFlag } from 'client/scripts/hooks/useFlag';
import { notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import './Governance.scss';

const Governance = () => {
  const governancePageEnabled = useFlag('governancePage');
  
  const [isEnabled, setIsEnabled] = useState(false);

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
  };

  if (!governancePageEnabled) {
    return null;
  }

  return (
    <section className="Governance">
      <div className="header">
        <CWText type="h4">Governance Page</CWText>
        <CWToggle
          checked={isEnabled}
          onChange={handleToggle}
        />
      </div>

      <CWText type="b1">
        Enable your community members to access governance tools, proposals, and treasury 
        information on this optional page. Simply toggle on to generate the page and make 
        it accessible within the sidebar, or toggle off to hide.
      </CWText>

      <div className="cta-section">
        <CWButton
          buttonType="secondary"
          label="Save Changes"
          onClick={() => {
            notifySuccess('Changes saved successfully');
          }}
        />
      </div>
    </section>
  );
};

export default Governance;
