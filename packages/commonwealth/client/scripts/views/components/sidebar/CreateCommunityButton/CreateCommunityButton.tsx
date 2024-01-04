import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import './CreateCommunityButton.scss';

const CreateCommunityButton = () => {
  const navigate = useCommonNavigate();

  const handleCreateCommunity = () => {
    navigate('/createCommunity', {}, null);
  };

  return (
    <div className="CreateCommunityButton">
      <CWButton
        label="Create Community"
        buttonHeight="sm"
        buttonWidth="full"
        onClick={handleCreateCommunity}
      />
    </div>
  );
};

export default CreateCommunityButton;
