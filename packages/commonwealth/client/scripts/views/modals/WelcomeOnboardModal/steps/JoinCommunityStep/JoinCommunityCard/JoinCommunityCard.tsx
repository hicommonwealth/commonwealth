import clsx from 'clsx';
import { pluralizeWithoutNumberPrefix } from 'helpers';
import ChainInfo from 'models/ChainInfo';
import React from 'react';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './JoinCommunityCard.scss';

type JoinCommunityCardProps = {
  community: ChainInfo;
  isJoined?: boolean;
  canJoin?: boolean;
  onJoinClick?: () => void;
};

const JoinCommunityCard = ({
  community,
  canJoin = true,
  isJoined = false,
  onJoinClick = () => {},
}: JoinCommunityCardProps) => {
  const roundedAddressCount =
    community?.profileCount > 1000
      ? `${(community?.profileCount / 1000) | 0}K+`
      : community?.profileCount;
  return (
    <div className="JoinCommunityCard">
      <CWCommunityAvatar community={community} size="xl" />

      <div className="info">
        <CWText type="h4" title={community?.name} fontWeight="semiBold">
          {community?.name}
        </CWText>

        <div className="counts">
          <CWText type="b2" title={`${community?.profileCount}`}>
            {roundedAddressCount}&nbsp;
            {pluralizeWithoutNumberPrefix(community?.profileCount, 'Member')}
          </CWText>

          <CWText className="dot">•</CWText>

          <CWText type="b2" title={`${community?.threadCount}`}>
            {community?.threadCount}&nbsp;
            {pluralizeWithoutNumberPrefix(community?.threadCount, 'Thread')}
          </CWText>
        </div>
      </div>

      <CWButton
        containerClassName={clsx('join-btn', {
          isJoined,
        })}
        buttonWidth="narrow"
        buttonHeight="sm"
        buttonType="tertiary"
        label={!isJoined ? 'Join Community' : 'Joined'}
        {...(isJoined && {
          iconLeft: 'checkCircleFilled',
          iconLeftWeight: 'fill',
        })}
        disabled={!canJoin}
        // @ts-expect-error <StrictNullChecks/>
        onClick={canJoin ? onJoinClick : null}
      />
    </div>
  );
};

export { JoinCommunityCard };
