import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  parsePathname,
} from 'mithrilInterop';
import $ from 'jquery';

import 'pages/new_profile/index.scss';

import app from 'state';
import type { Thread} from 'models';
import { ChainInfo, AddressInfo, NewProfile as Profile } from 'models';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';

import NewProfileHeader from './new_profile_header';
import type {
  CommentWithAssociatedThread} from './new_profile_activity';
import NewProfileActivity from './new_profile_activity';
import Sublayout from '../../sublayout';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { ImageBehavior } from '../../components/component_kit/cw_cover_image_uploader';
import PageNotFound from '../404';

enum ProfileError {
  None,
  NoAddressFound,
  NoProfileFound,
}

type NewProfileAttrs = {
  address: string;
};

const NoAddressFoundError = 'No address found';
const NoProfileFoundError = 'No profile found';

const NewProfile = (props: NewProfileAttrs) => {
  const [addresses, setAddresses] = React.useState<AddressInfo[]>();
  const [chains, setChains] = React.useState<ChainInfo[]>();
  const [comments, setComments] = React.useState<CommentWithAssociatedThread[]>([]);
  const [error, setError] = React.useState<ProfileError>();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [profile, setProfile] = React.useState<Profile>();
  const [threads, setThreads] = React.useState<Thread[]>([]);

  const getProfileData = async (address: string) => {
    setLoading(true);
    try {
      const response = await $.get(`${app.serverUrl()}/profile/v2`, {
        address,
        jwt: app.user.jwt,
      });

      setProfile(new Profile(response.profile));
      setThreads(response.threads.map((t) => app.threads.modelFromServer(t)));
      const responseComments = response.comments.map((c) => modelCommentFromServer(c));
      const commentsWithAssociatedThread = responseComments.map((c) => {
        const thread = response.commentThreads.find(
          (t) =>
            t.id === parseInt(c.rootProposal.replace('discussion_', ''), 10)
        );
        return { ...c, thread };
      });
      setComments(commentsWithAssociatedThread);
      setChains(response.chains.map((c) => ({
        ...new ChainInfo(c),
        iconUrl: c.icon_url,
      })));
      setAddresses(response.addresses.map(
        (a) =>
          new AddressInfo(
            a.id,
            a.address,
            a.chain,
            a.keytype,
            a.wallet_id,
            a.ghost_address
          )
      ));
    } catch (err) {
      if (
        err.status === 500 &&
        err.responseJSON.error === NoAddressFoundError
      ) {
        setError(ProfileError.NoAddressFound);
      }
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
    console.log('props.address', props.address);
    getProfileData(props.address);
  }, []);

  if (loading)
    return (
      <Sublayout>
        <div className="ProfilePage">
          <div className="loading-spinner">
            <CWSpinner />
          </div>
        </div>
      </Sublayout>
    );

  if (error === ProfileError.NoAddressFound)
    return <PageNotFound message="We cannot find this profile." />;

  if (error === ProfileError.NoProfileFound)
    return <PageNotFound message="We cannot find this profile." />;

  if (error === ProfileError.None) {
    if (!profile) return;

    let coverUrl;
    let coverImageBehavior;
    let backgroundUrl;
    let backgroundImageBehavior;

    if (profile.coverImage) {
      const { url, imageBehavior } = profile.coverImage;
      coverUrl = url;
      coverImageBehavior = imageBehavior;
    }

    if (profile.backgroundImage) {
      const { url, imageBehavior } = profile.backgroundImage;
      backgroundUrl = url;
      backgroundImageBehavior = imageBehavior;
    }

    return (
      <Sublayout>
        <div
          className="ProfilePage"
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
          {profile.coverImage && (
            <div
              style={{
                backgroundImage: `url(${coverUrl})`,
                backgroundRepeat: `${
                  coverImageBehavior === ImageBehavior.Fill
                    ? 'no-repeat'
                    : 'repeat'
                }`,
                backgroundSize:
                  coverImageBehavior === ImageBehavior.Fill ? 'cover' : '100px',
                backgroundPosition:
                  coverImageBehavior === ImageBehavior.Fill ? 'center' : '0 0',
                height: '240px',
              }}
            />
          )}
          <div
            className={
              profile.backgroundImage
                ? 'ProfilePageContainer'
                : 'ProfilePageContainer smaller-margins'
            }
          >
            <NewProfileHeader profile={profile} address={props.address} />
            <NewProfileActivity
              threads={threads}
              comments={comments}
              chains={chains}
              addresses={addresses}
            />
          </div>
        </div>
      </Sublayout>
    );
  } else {
    return (
      <Sublayout>
        <div className="ProfilePage">
          <div className="ProfilePageContainer">
            <NewProfileHeader profile={profile} address={props.address} />
            <NewProfileActivity
              threads={threads}
              comments={comments}
              chains={chains}
              addresses={addresses}
            />
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default NewProfile;
