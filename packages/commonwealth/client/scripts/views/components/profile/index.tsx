import React from 'react';
import $ from 'jquery';

import 'components/profile/index.scss';

import app from 'state';
import type { Thread } from 'models';
import { AddressInfo, NewProfile as Profile } from 'models';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';

import ProfileHeader from './profile_header';
import type { CommentWithAssociatedThread } from './profile_activity';
import ProfileActivity from './profile_activity';
import { CWSpinner } from '../component_kit/cw_spinner';
import { ImageBehavior } from '../component_kit/cw_cover_image_uploader';
import { PageNotFound } from '../../pages/404';
import Sublayout from '../../sublayout';

enum ProfileError {
  None,
  NoProfileFound,
}

type ProfileProps = {
  profileId: string;
};

const NoProfileFoundError = 'No profile found';

const ProfileComponent = (props: ProfileProps) => {
  const [addresses, setAddresses] = React.useState<AddressInfo[]>();
  const [comments, setComments] = React.useState<CommentWithAssociatedThread[]>(
    []
  );
  const [error, setError] = React.useState<ProfileError>(ProfileError.None);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [profile, setProfile] = React.useState<Profile>();
  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [isOwner, setIsOwner] = React.useState<boolean>();

  const getProfileData = async (query: string) => {
    setLoading(true);
    try {
      const { result } = await $.get(`${app.serverUrl()}/profile/v2`, {
        profileId: query,
        jwt: app.user.jwt,
      });

      setProfile(new Profile(result.profile));
      setThreads(result.threads.map((t) => app.threads.modelFromServer(t)));
      const responseComments = result.comments.map((c) =>
        modelCommentFromServer(c)
      );
      const commentsWithAssociatedThread = responseComments.map((c) => {
        const thread = result.commentThreads.find(
          (t) =>
            t.id === parseInt(c.rootProposal.replace('discussion_', ''), 10)
        );
        return { ...c, thread };
      });
      setComments(commentsWithAssociatedThread);
      setAddresses(
        result.addresses.map(
          (a) =>
            new AddressInfo(
              a.id,
              a.address,
              a.chain,
              a.keytype,
              a.wallet_id,
              a.ghost_address
            )
        )
      );
      setIsOwner(result.isOwner);
    } catch (err) {
      if (
        err.status === 500 &&
        err.responseJSON.error === NoProfileFoundError
      ) {
        setError(ProfileError.NoProfileFound);
      }
    }
    setLoading(false);
  };

  React.useEffect(() => {
    getProfileData(props.profileId);
  }, []);

  if (loading)
    return (
      <div className="Profile loading">
        <div className="loading-spinner">
          <CWSpinner />
        </div>
      </div>
    );

  if (error === ProfileError.NoProfileFound)
    return <PageNotFound message="We cannot find this profile." />;

  if (error === ProfileError.None) {
    if (!profile) return;

    let backgroundUrl;
    let backgroundImageBehavior;

    if (profile.backgroundImage) {
      const { url, imageBehavior } = profile.backgroundImage;
      backgroundUrl = url;
      backgroundImageBehavior = imageBehavior;
    }

    return (
      <Sublayout>
        <div
          className="Profile"
          style={
            profile.backgroundImage
              ? {
                  backgroundImage: `url(${backgroundUrl})`,
                  backgroundRepeat: `${
                    backgroundImageBehavior === ImageBehavior.Fill
                      ? 'no-repeat'
                      : 'repeat'
                  }`,
                  backgroundSize:
                    backgroundImageBehavior === ImageBehavior.Fill
                      ? 'cover'
                      : '100px',
                  backgroundPosition:
                    backgroundImageBehavior === ImageBehavior.Fill
                      ? 'center'
                      : '56px 56px',
                  backgroundAttachment: 'fixed',
                }
              : {}
          }
        >
          <div
            className={
              profile.backgroundImage
                ? 'ProfilePageContainer'
                : 'ProfilePageContainer smaller-margins'
            }
          >
            <ProfileHeader profile={profile} isOwner={isOwner} />
            <ProfileActivity
              threads={threads}
              comments={comments}
              addresses={addresses}
            />
          </div>
        </div>
      </Sublayout>
    );
  } else {
    return (
      <Sublayout>
        <div className="Profile">
          <div className="ProfilePageContainer">
            <ProfileHeader profile={profile} isOwner={isOwner} />
            <ProfileActivity
              threads={threads}
              comments={comments}
              addresses={addresses}
            />
          </div>
        </div>
      </Sublayout>
    );
  }
};

export default ProfileComponent;
