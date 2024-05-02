import React, { useState } from 'react';
import app from 'state';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWIdentificationTag } from 'views/components/component_kit/new_designs/CWIdentificationTag';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

const TagsShowcase = () => {
  const dydx = app.config.chains.getById('dydx');
  const [communityId, setCommunityId] = useState(dydx);

  return (
    <>
      <CWText type="h5">Spam</CWText>
      <div className="flex-row">
        <CWTag label="SPAM" type="spam" />
      </div>

      <CWText type="h5">Status</CWText>
      <div className="flex-row">
        <CWTag label="New" type="new" iconName="newStar" />
        <CWTag label="Trending" type="trending" iconName="trendUp" />
      </div>

      <CWText type="h5">Elements</CWText>
      <div className="flex-row">
        <CWTag label="Poll" type="poll" />
        <CWTag label="Snapshot" type="active" />
      </div>

      <CWText type="h5">Stage</CWText>
      <div className="flex-row">
        <CWTag label="Stage 1" type="stage" classNames="phase-1" />
        <CWTag label="Stage 2" type="stage" classNames="phase-2" />
        <CWTag label="Stage 3" type="stage" classNames="phase-3" />
        <CWTag label="Stage 4" type="stage" classNames="phase-4" />
        <CWTag label="Stage 5" type="stage" classNames="phase-5" />
        <CWTag label="Stage 6" type="stage" classNames="phase-6" />
        <CWTag label="Stage 7" type="stage" classNames="phase-7" />
        <CWTag label="Stage 8" type="stage" classNames="phase-8" />
        <CWTag label="Stage 9" type="stage" classNames="phase-9" />
      </div>

      <CWText type="h5">Proposal</CWText>
      <div className="flex-row">
        <CWTag label="Proposal" type="proposal" />
      </div>

      <CWText type="h5">Input</CWText>
      <div className="flex-row">
        {communityId && (
          <CWTag
            label={dydx.name}
            type="input"
            community={dydx}
            onClick={() => setCommunityId(null)}
          />
        )}
      </div>

      <CWText type="h5">Login User</CWText>
      <div className="flex-row">
        <CWTag label="mnh7a" type="login" iconName="cosmos" />
        <CWTag label="mnh7a" type="login" iconName="discordOld" />
        <CWTag label="mnh7a" type="login" iconName="discord" />
        <CWTag label="mnh7a" type="login" iconName="envelope" />
        <CWTag label="mnh7a" type="login" iconName="ethereum" />
        <CWTag label="mnh7a" type="login" iconName="octocat" />
        <CWTag label="mnh7a" type="login" iconName="near" />
        <CWTag label="mnh7a" type="login" iconName="polkadot" />
        <CWTag label="mnh7a" type="login" iconName="polygon" />
        <CWTag label="mnh7a" type="login" iconName="twitterNew" />
      </div>

      <CWText type="h5">Address</CWText>
      <div className="flex-row">
        <CWTag label="0xd83e1...a39bD" type="address" iconName="cosmos" />
        <CWTag label="0xd83e1...a39bD" type="address" iconName="discord" />
        <CWTag label="0xd83e1...a39bD" type="address" iconName="envelope" />
        <CWTag label="0xd83e1...a39bD" type="address" iconName="ethereum" />
        <CWTag label="0xd83e1...a39bD" type="address" iconName="octocat" />
        <CWTag label="0xd83e1...a39bD" type="address" iconName="near" />
        <CWTag label="0xd83e1...a39bD" type="address" iconName="polkadot" />
        <CWTag label="0xd83e1...a39bD" type="address" iconName="polygon" />
        <CWTag label="0xd83e1...a39bD" type="address" iconName="twitterNew" />
      </div>

      <CWText type="h5">Group</CWText>
      <div className="flex-row">
        <CWTag label="Group Name" type="group" />
      </div>

      <CWText type="h5">Identification</CWText>
      <div className="flex-row">
        <CWIdentificationTag address="0x725D899B56630780344F00146E1B29aBEf6D6303" />
      </div>

      <CWText type="h5">Contest</CWText>
      <div className="flex-row">
        <CWTag label="1st" type="contest" classNames="prize-1" />
        <CWTag label="2nd" type="contest" classNames="prize-2" />
        <CWTag label="3rd" type="contest" classNames="prize-3" />
        <CWTag label="4th" type="contest" />
        <CWTag label="5th" type="contest" />
      </div>
    </>
  );
};

export default TagsShowcase;
