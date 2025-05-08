import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './TopicGatingHelpMessage.scss';

const TopicGatingHelpMessage = () => {
  const navigate = useCommonNavigate();

  return (
    <section className="TopicGatingHelpMessage">
      <CWIcon
        iconName="circlesThreeplus"
        iconSize="large"
        className="group-icon"
      />
      <CWText type="h4" fontWeight="semiBold" className="header-text">
        Create groups with your tokens
      </CWText>
      <CWText type="b2">
        Groups allow you to organize your community and set permissions for
        different sections. You can create groups using:
      </CWText>
      <ul className="token-support-list">
        <li>
          <CWIcon iconName="ethereum" iconSize="small" />
          <CWText type="b2">
            Ethereum tokens (ERC20 tokens and native ETH)
          </CWText>
        </li>
        <li>
          <CWIcon iconName="ethereum" iconSize="small" />
          <CWText type="b2">Base tokens</CWText>
        </li>
        <li>
          <CWIcon iconName="ethereum" iconSize="small" />
          <CWText type="b2">Other supported chain tokens</CWText>
        </li>
      </ul>
      <CWText type="b2">
        Non-group members can still view gated topics but won't be able to
        create threads, upvote, or comment within these topics.
      </CWText>
      <CWButton
        buttonWidth="full"
        label="Create your first group"
        onClick={() => navigate('/members/groups/create')}
        iconLeft="plus"
      />
    </section>
  );
};

export default TopicGatingHelpMessage;
