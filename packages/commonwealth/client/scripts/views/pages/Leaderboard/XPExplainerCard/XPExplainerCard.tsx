import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import React from 'react';
import './XPExplainerCard.scss';

const XPExplainerCard = () => {
  return (
    <section className="XPExplainerCard">
      <CWText type="h4">What is Aura?</CWText>
      <CWText type="b2">
        Aura is what Common users earn when they engage on the platform, play
        games on our Telegram Bot, and complete quests from the communities you
        join!
        <br />
        <br />
        <a
          href="https://blog.common.xyz/what-is-common-aura/"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          Learn more about ways to earn Aura here.
        </a>
      </CWText>
    </section>
  );
};

export default XPExplainerCard;
