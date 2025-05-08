import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './GroupsFeatureCard.scss';

type GroupsFeatureCardProps = {
  onExploreGroupsClick: () => void;
};

const GroupsFeatureCard = ({
  onExploreGroupsClick,
}: GroupsFeatureCardProps) => {
  return (
    <div className="GroupsFeatureCard">
      <div className="card-content">
        <CWIcon iconName="circlesThreeplus" iconSize="medium" />
        <div className="text-content">
          <CWText type="h4">Organize your community with Groups</CWText>
          <CWText type="b2">
            Create groups based on token holdings including Ethereum tokens
            (ERC20, ETH), Base tokens, and more. Use groups to manage
            permissions and member roles.
          </CWText>
        </div>
        <CWButton
          label="Explore Groups"
          buttonType="secondary"
          onClick={onExploreGroupsClick}
        />
      </div>
    </div>
  );
};

export default GroupsFeatureCard;
