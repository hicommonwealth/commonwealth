import { DEFAULT_NAME } from '@hicommonwealth/shared';
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useFetchProfileByIdQuery } from 'state/api/profiles';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import Comment from '../../../models/Comment';
import NewProfile from '../../../models/NewProfile';
import Thread from '../../../models/Thread';
import { CWText } from '../../components/component_kit/cw_text';
import { PageNotFound } from '../../pages/404';
import { ImageBehavior } from '../component_kit/CWImageInput';
import CWCircleMultiplySpinner from '../component_kit/new_designs/CWCircleMultiplySpinner';
import './Profile.scss';
import type { CommentWithAssociatedThread } from './ProfileActivity';
import ProfileActivity from './ProfileActivity';
import ProfileHeader from './ProfileHeader';

enum ProfileError {
  None,
  NoProfileFound,
}

type ProfileProps = {
  userId: number;
};

const Profile = ({ userId }: ProfileProps) => {
  const [errorCode, setErrorCode] = useState<ProfileError>(ProfileError.None);
  const [profile, setProfile] = useState<NewProfile>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>();
  const [comments, setComments] = useState<CommentWithAssociatedThread[]>([]);
  const { data, error, isLoading } = useFetchProfileByIdQuery({
    userId,
    apiCallEnabled: !!userId,
  });

  useEffect(() => {
    if (isLoading) return;
    if (error) {
      setErrorCode(ProfileError.NoProfileFound);
      setProfile(undefined);
      setThreads([]);
      setIsOwner(undefined);
      setComments([]);
    }
    if (data) {
      setProfile(
        new NewProfile({ ...data.profile, userId, isOwner: isOwner ?? false }),
      );
      setThreads(data.threads.map((t) => new Thread(t)));
      // @ts-expect-error <StrictNullChecks/>
      const responseComments = data.comments.map((c) => new Comment(c));

      const commentsWithAssociatedThread = responseComments.map((c) => {
        const thread = data.commentThreads.find(
          // @ts-expect-error <StrictNullChecks/>
          (t) => t.id === parseInt(c.threadId, 10),
        );
        return { ...c, thread, communityId: thread?.community_id };
      });
      // @ts-expect-error <StrictNullChecks/>
      setComments(commentsWithAssociatedThread);
      setIsOwner(data.isOwner);
      setErrorCode(ProfileError.None);
    }
  }, [userId, data, isLoading, error, isOwner]);

  if (isLoading)
    return (
      <div className="Profile loading">
        <div className="loading-spinner">
          <CWCircleMultiplySpinner />
        </div>
      </div>
    );

  if (errorCode === ProfileError.NoProfileFound)
    return <PageNotFound message="We cannot find this profile." />;

  if (errorCode === ProfileError.None) {
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
        <CWPageLayout>
          <Helmet>
            <link
              rel="canonical"
              href={`https://commonwealth.im/profile/id/${userId}`}
            />
          </Helmet>

          <div className="header">
            <CWText type="h2" fontWeight="medium">
              {profile.name
                ? `${profile.name}'s Profile`
                : `${DEFAULT_NAME} user's Profile`}
            </CWText>
          </div>
          <div
            className={
              profile.backgroundImage
                ? 'ProfilePageContainer'
                : 'ProfilePageContainer smaller-margins'
            }
          >
            {/* @ts-expect-error StrictNullChecks*/}
            <ProfileHeader profile={profile} isOwner={isOwner} />
            <ProfileActivity threads={threads} comments={comments} />
          </div>
        </CWPageLayout>
      </div>
    );
  } else {
    return (
      <CWPageLayout>
        <div className="Profile">
          <div className="ProfilePageContainer">
            {/* @ts-expect-error StrictNullChecks*/}
            <ProfileHeader profile={profile} isOwner={isOwner} />
            <ProfileActivity threads={threads} comments={comments} />
          </div>
        </div>
      </CWPageLayout>
    );
  }
};

export default Profile;
