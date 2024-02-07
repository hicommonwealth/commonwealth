import axios from 'axios';
import 'components/Profile/Profile.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import AddressInfo from '../../../models/AddressInfo';
import Comment from '../../../models/Comment';
import NewProfile from '../../../models/NewProfile';
import Thread from '../../../models/Thread';
import { CWText } from '../../components/component_kit/cw_text';
import { PageNotFound } from '../../pages/404';
import { ImageBehavior } from '../component_kit/cw_cover_image_uploader';
import { CWSpinner } from '../component_kit/cw_spinner';
import type { CommentWithAssociatedThread } from './ProfileActivity';
import ProfileActivity from './ProfileActivity';
import ProfileHeader from './ProfileHeader';

enum ProfileError {
  None,
  NoProfileFound,
}

type ProfileProps = {
  profileId: string;
};

const NoProfileFoundError = 'No profile found';

const Profile = ({ profileId }: ProfileProps) => {
  const [addresses, setAddresses] = useState<AddressInfo[]>();
  const [comments, setComments] = useState<CommentWithAssociatedThread[]>([]);
  const [error, setError] = useState<ProfileError>(ProfileError.None);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<NewProfile>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>();

  const getProfileData = async (query: string, signal: AbortSignal) => {
    setLoading(true);
    try {
      const response = await axios.get(`${app.serverUrl()}/profile/v2`, {
        params: {
          profileId: query,
          jwt: app.user.jwt,
        },
        signal,
      });

      const { result } = response.data;

      setProfile(new NewProfile(result.profile));
      setThreads(result.threads.map((t) => new Thread(t)));

      const responseComments = result.comments.map((c) => new Comment(c));
      const commentsWithAssociatedThread = responseComments.map((c) => {
        const thread = result.commentThreads.find(
          (t) => t.id === parseInt(c.threadId, 10),
        );
        return { ...c, thread };
      });
      setComments(commentsWithAssociatedThread);

      setAddresses(
        result.addresses.map((a) => {
          try {
            return new AddressInfo({
              id: a.id,
              address: a.address,
              chainId: a.community_id,
              keytype: a.keytype,
              walletId: a.wallet_id,
              walletSsoSource: a.wallet_sso_source,
              ghostAddress: a.ghost_address,
            });
          } catch (err) {
            console.error(`Could not return AddressInfo: "${err}"`);
            return null;
          }
        }),
      );

      setIsOwner(result.isOwner);
    } catch (err) {
      if (
        err.response &&
        err.response.status === 500 &&
        err.response.data.error === NoProfileFoundError
      ) {
        setError(ProfileError.NoProfileFound);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    getProfileData(profileId, signal);

    return () => abortController.abort();
  }, [profileId]);

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
        <div className="header">
          <CWText type="h2" fontWeight="medium">
            {profile.name
              ? `${profile.name}'s Profile`
              : `Anonymous user's Profile`}
          </CWText>
        </div>
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
    );
  } else {
    return (
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
    );
  }
};

export default Profile;
