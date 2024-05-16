import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { useFlag } from '../../../../../hooks/useFlag';
import './TopicGatingHelpMessage.scss';

const TopicGatingHelpMessage = () => {
  const allowlistEnabled = useFlag('allowlist');

  if (allowlistEnabled) {
    return (
      <section className="TopicGatingHelpMessage">
        <CWText type="h4" fontWeight="semiBold" className="header-text">
          How does gating a group impact my community?
        </CWText>
        <CWText type="b2">
          Enabling groups allows admins to created gated discussion topics.
          Non-group members can still view the gated topics but will not be able
          to create threads, upvote, or comment on threads within the gated
          topic(s). You can always create another group with different
          requirements and add any topics to gate, including previously gated
          topics.
        </CWText>
      </section>
    );
  }
  return (
    <section className="TopicGatingHelpMessage">
      <CWText type="h4" fontWeight="semiBold" className="header-text">
        How does gating a topic impact my community?
      </CWText>
      <CWText type="b2">
        Non-group members can still view the gated topics but will not be able
        to create threads, upvote, or comment on threads within the gated
        topic(s). You can always create another group with different
        requirements and add any topics to gate, including previously gated
        topics.
      </CWText>
    </section>
  );
};

export default TopicGatingHelpMessage;
