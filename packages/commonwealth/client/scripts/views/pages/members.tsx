import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import 'pages/members.scss';

import app from 'state';
import type { Profile } from 'models';
import { AccessLevel } from 'models';
import { User } from 'views/components/user/user';
import Sublayout from 'views/sublayout';
import { CWText } from '../components/component_kit/cw_text';

type MemberInfo = {
  profile: Profile;
};

const MembersPage = () => {
  const [membersList, setMembersList] = React.useState<Array<MemberInfo>>([]);

  const activeInfo = app.chain.meta;

  React.useEffect(() => {
    const fetch = async () => {
      await activeInfo.getMembers(activeInfo.id);

      const accessLevelOrder = Object.values(AccessLevel);

      const membersCopy = [...activeInfo.members];

      const membersCopySortedByPerms = membersCopy.sort(
        (a, b) =>
          accessLevelOrder.indexOf(a.permission) -
          accessLevelOrder.indexOf(b.permission)
      );

      const profiles: Array<MemberInfo> = membersCopySortedByPerms.map(
        (role) => ({
          profile: app.profiles.getProfile(role.address_chain, role.address),
        })
      );

      setMembersList(profiles);
    };

    fetch();
  }, []);

  return (
    <Sublayout>
      <div className="MembersPage">
        <CWText type="h3" fontWeight="medium">
          Members ({membersList.length})
        </CWText>
        <Virtuoso
          data={membersList}
          itemContent={(index, profileInfo) => {
            return (
              <div className="member-row" key={index}>
                <User
                  user={profileInfo.profile}
                  showRole
                  hideAvatar={false}
                  linkify
                />
              </div>
            );
          }}
        />
      </div>
    </Sublayout>
  );
};

export default MembersPage;
