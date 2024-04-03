import { useCommonNavigate } from 'navigation/helpers';
import 'pages/why_commonwealth.scss';
import React from 'react';
import { CWText } from '../components/component_kit/cw_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';

const WhyCommonwealthPage = () => {
  const navigate = useCommonNavigate();

  return (
    <div className="WhyCommonwealthPage">
      <div className="inner-container">
        <CWText type="h3">
          Crypto-native communities deserve crypto-native software.
        </CWText>
        <CWButton
          label="Read The Docs"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = 'https://docs.commonwealth.im/commonwealth/';
          }}
        />
        <CWText type="h4">The medium is the message.</CWText>
        <CWText type="h4">Threads drive thoughtful conversation.</CWText>
        <CWText>
          On Commonwealth, threads leave space for your community members to
          engage in thoughtful conversation. Curate threads by grouping them
          into featured tags, or lock threads to a select group of community
          members.
        </CWText>
        <CWButton
          label="Explore Our Communities"
          onClick={(e) => {
            e.preventDefault();
            navigate('/communities', {}, null);
          }}
        />
        <CWText>
          Commonwealth helps break down silos between chat apps like Discord,
          Telegram, and Riot by providing integrations for webhooks and bridges.
          Your community will be able to receive Commonwealth notifications
          wherever they are most comfortable.
        </CWText>
        <CWText type="h3">Your tech should match your values.</CWText>
        <CWText type="h4">
          Crypto-native integrations for the most popular protocols.
        </CWText>
        <CWText>
          No matter what protocol you build on, give easy access to your
          project&apos;s most important on-chain actions like staking and
          voting. Commonwealth has a growing list of integrations--including
          Ethereum, NEAR, Cosmos, Substrate, and popular DAO frameworks like
          Aragon.
        </CWText>
        <CWText>
          Fork, develop, alter, share - Commonwealth is explicitly designed for
          open-source ecosystems. Existing solutions like chat and email lock
          your data, users, and brand into platforms you don&apos;t control.
          Default openness allows new members to discover you through SEO.
        </CWText>
        <CWText>
          Commonwealth combines all the features of your favorite tools into a
          single platform.
        </CWText>
        <img src="static/img/wealthTable.svg" />
      </div>
    </div>
  );
};

export default WhyCommonwealthPage;
