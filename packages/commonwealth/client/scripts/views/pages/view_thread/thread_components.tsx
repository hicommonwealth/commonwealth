import { useCommonNavigate } from 'navigation/helpers';
import 'pages/view_proposal/proposal_header_links.scss';
import 'pages/view_thread/thread_components.scss';
import React from 'react';
import app from 'state';
import { pluralize, threadStageToLabel } from '../../../helpers/index';
import type Account from '../../../models/Account';
import type Thread from '../../../models/Thread';
import { ThreadStage } from '../../../models/types';
import {
  Popover,
  usePopover,
} from '../../components/component_kit/cw_popover/cw_popover';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { User } from '../../components/user/user';

type ThreadAuthorProps = {
  author: Thread['author'];
  collaborators: Thread['collaborators'];
};

export const ThreadAuthor = ({ author, collaborators }: ThreadAuthorProps) => {
  const popoverProps = usePopover();

  const user: Account = app.chain.accounts.get(author);

  return (
    <div className="ThreadAuthor">
      <User
        avatarSize={24}
        userAddress={user.address}
        userChainId={user.community?.id || user.profile?.chain}
        shouldShowPopover
        shouldLinkProfile
      />
      {collaborators?.length > 0 && (
        <>
          <CWText type="caption">and</CWText>
          <CWText
            type="caption"
            className="trigger-text"
            onMouseEnter={popoverProps.handleInteraction}
            onMouseLeave={popoverProps.handleInteraction}
          >
            {pluralize(collaborators?.length, 'other')}
            <Popover
              content={
                <div className="collaborators">
                  {collaborators.map(({ address, community_id }) => {
                    return (
                      <User
                        key={address}
                        shouldLinkProfile
                        userChainId={community_id}
                        userAddress={address}
                      />
                    );
                  })}
                </div>
              }
              {...popoverProps}
            />
          </CWText>
        </>
      )}
    </div>
  );
};

interface ThreadStageComponentProps {
  stage: Thread['stage'];
}

export const ThreadStageComponent = ({ stage }: ThreadStageComponentProps) => {
  const navigate = useCommonNavigate();

  return (
    <CWText
      type="caption"
      className={getClasses<{ stage: 'negative' | 'positive' }>(
        {
          stage:
            stage === ThreadStage.ProposalInReview
              ? 'positive'
              : stage === ThreadStage.Voting
              ? 'positive'
              : stage === ThreadStage.Passed
              ? 'positive'
              : stage === ThreadStage.Failed
              ? 'negative'
              : 'positive',
        },
        'proposal-stage-text',
      )}
      onClick={(e) => {
        e.preventDefault();
        navigate(`/discussions?stage=${stage}`);
      }}
    >
      {threadStageToLabel(stage)}
    </CWText>
  );
};
