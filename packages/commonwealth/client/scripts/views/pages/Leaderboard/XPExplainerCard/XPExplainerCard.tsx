import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import React from 'react';
import './XPExplainerCard.scss';

const XPExplainerCard = () => {
  return (
    <section className="XPExplainerCard">
      <CWText type="h4">What is XP?</CWText>
      <CWText type="b2">
        Experience Points (XP) are what Common users earn when they engage on
        the platform, play games on our Telegram Bot, and complete quests from
        the communities they&apos;re apart of!
        <br />
        <br />
        XP can be converted to community tokens, which in turn hold real
        value.&nbsp;
        <a href="#" target="_blank" rel="noopener noreferrer" className="link">
          Learn more about ways to earn XP here.
        </a>
      </CWText>
    </section>
  );
};

export default XPExplainerCard;
