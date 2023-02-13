import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { getRoute } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';
import $ from 'jquery';

import 'pages/new_profile/index.scss';

import app from 'state';
import type { Thread } from 'models';
import { AddressInfo, ChainInfo, NewProfile as Profile } from 'models';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';
import withRouter from 'navigation/helpers';
import { PageLoading } from './loading';
import { PageNotFound } from './404';
import Sublayout from '../sublayout';
import NewProfileHeader from './new_profile/new_profile_header';
import type { CommentWithAssociatedThread } from './new_profile/new_profile_activity';
import NewProfileActivity from './new_profile/new_profile_activity';
import { ImageBehavior } from '../components/component_kit/cw_cover_image_uploader';

type NewProfileRedirectAttrs = {
  address: string;
};

// TODO: this is a temporary solution to redirect old profile links (using address)
// to new profile links (using username). this should be removed once PR4 is merged
class NewProfileRedirect extends ClassComponent<NewProfileRedirectAttrs> {
  private profile: Profile;
  private addresses: AddressInfo[];
  private comments: CommentWithAssociatedThread[];
  private chains: ChainInfo[];
  private threads: Thread[];
  private isOwner: boolean;
  private loading: boolean;
  private error: boolean;

  private getLinkedProfile = async (address: string) => {
    this.loading = true;
    try {
      const response = await $.get(`${app.serverUrl()}/profile/v2`, {
        address,
        jwt: app.user.jwt,
      });

      this.profile = new Profile(response.profile);
      this.threads = response.threads.map((t) =>
        app.threads.modelFromServer(t)
      );
      const responseComments = response.comments.map((c) =>
        modelCommentFromServer(c)
      );
      const commentsWithAssociatedThread = responseComments.map((c) => {
        const thread = response.commentThreads.find(
          (t) =>
            t.id === parseInt(c.rootProposal.replace('discussion_', ''), 10)
        );
        return { ...c, thread };
      });
      this.comments = commentsWithAssociatedThread;
      this.chains = response.chains.map((c) => ({
        ...new ChainInfo(c),
        iconUrl: c.icon_url,
      }));
      this.addresses = response.addresses.map(
        (a) =>
          new AddressInfo(
            a.id,
            a.address,
            a.chain,
            a.keytype,
            a.wallet_id,
            a.ghost_address
          )
      );
      this.isOwner = response.isOwner;
    } catch (err) {
      this.error = true;
    }
    this.loading = false;
  };

  oninit(vnode: ResultNode<NewProfileRedirectAttrs>) {
    this.getLinkedProfile(vnode.attrs.address);
  }

  view() {
    if (this.loading) {
      return <PageLoading />;
    }

    if (this.error || !this.profile) {
      return <PageNotFound message="We cannot find this profile." />;
    }

    if (this.profile.username) {
      if (getRoute().includes('/edit')) {
        this.setRoute(`/profile/${this.profile.username}/edit`);
      } else {
        this.setRoute(`/profile/${this.profile.username}`);
      }
    }

    const { backgroundImage, coverImage } = this.profile;
    let coverUrl;
    let coverImageBehavior;
    let backgroundUrl;
    let backgroundImageBehavior;

    if (coverImage) {
      const { url, imageBehavior } = coverImage;
      coverUrl = url;
      coverImageBehavior = imageBehavior;
    }

    if (backgroundImage) {
      const { url, imageBehavior } = backgroundImage;
      backgroundUrl = url;
      backgroundImageBehavior = imageBehavior;
    }

    const { threads, comments, chains, addresses, isOwner } = this;

    return (
      <Sublayout>
        <div
          className="ProfilePage"
          style={
            backgroundImage
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
          {coverImage && (
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
              backgroundImage
                ? 'ProfilePageContainer'
                : 'ProfilePageContainer smaller-margins'
            }
          >
            <NewProfileHeader
              profile={{ ...this.profile, name: 'Anonymous user' } as Profile}
              isOwner={isOwner}
            />
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

export default withRouter(NewProfileRedirect);
