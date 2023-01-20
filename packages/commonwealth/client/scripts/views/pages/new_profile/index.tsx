/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import ClassComponent from 'class_component';

import 'pages/new_profile/index.scss';

import app from 'state';
import { Thread, ChainInfo, AddressInfo, NewProfile as Profile } from 'models';
import { modelFromServer as modelThreadFromServer } from 'controllers/server/threads';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';

import { NewProfileHeader } from './new_profile_header';
import {
  CommentWithAssociatedThread,
  NewProfileActivity,
} from './new_profile_activity';
import Sublayout from '../../sublayout';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { ImageBehavior } from '../../components/component_kit/cw_cover_image_uploader';
import { PageNotFound } from '../404';

enum ProfileError {
  None,
  NoAddressFound,
  NoProfileFound,
}

type NewProfileAttrs = {
  placeholder?: string;
};

const NoProfileFoundError = 'No profile found';

export default class NewProfile extends ClassComponent<NewProfileAttrs> {
  private address: string;
  private addresses: AddressInfo[];
  private chains: ChainInfo[];
  private content: m.Vnode;
  private comments: CommentWithAssociatedThread[];
  private error: ProfileError;
  private loading: boolean;
  private profile: Profile;
  private threads: Thread[];
  private username: string;
  private isOwner: boolean;

  private getProfileData = async (username: string) => {
    try {
      const response = await $.get(`${app.serverUrl()}/profile/v2`, {
        username,
        jwt: app.user.jwt,
      });

      this.profile = new Profile(response.profile);
      this.threads = response.threads.map((t) => modelThreadFromServer(t));
      const comments = response.comments.map((c) => modelCommentFromServer(c));
      const commentsWithAssociatedThread = comments.map((c) => {
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
      if (
        err.status === 500 &&
        err.responseJSON.error === NoProfileFoundError
      ) {
        this.error = ProfileError.NoProfileFound;
      }
    }
    m.redraw();
  };

  oninit() {
    this.username = m.route.param('username');
    this.loading = true;
    this.error = ProfileError.None;
    this.comments = [];
    this.threads = [];
    this.getProfileData(this.username);
    this.loading = false;
  }

  view() {
    if (this.loading)
      this.content = (
        <div class="ProfilePage">
          <div class="loading-spinner">
            <CWSpinner />
          </div>
        </div>
      );

    if (this.error === ProfileError.NoProfileFound)
      return <PageNotFound message="We cannot find this profile." />;

    if (this.error === ProfileError.None) {
      if (!this.profile) return;

      let coverUrl;
      let coverImageBehavior;
      let backgroundUrl;
      let backgroundImageBehavior;

      if (this.profile.coverImage) {
        const { url, imageBehavior } = this.profile.coverImage;
        coverUrl = url;
        coverImageBehavior = imageBehavior;
      }

      if (this.profile.backgroundImage) {
        const { url, imageBehavior } = this.profile.backgroundImage;
        backgroundUrl = url;
        backgroundImageBehavior = imageBehavior;
      }

      this.content = (
        <div
          className="ProfilePage"
          style={
            this.profile.backgroundImage
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
          {this.profile.coverImage && (
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
              this.profile.backgroundImage
                ? 'ProfilePageContainer'
                : 'ProfilePageContainer smaller-margins'
            }
          >
            <NewProfileHeader profile={this.profile} isOwner={this.isOwner} />
            <NewProfileActivity
              threads={this.threads}
              comments={this.comments}
              chains={this.chains}
              addresses={this.addresses}
            />
          </div>
        </div>
      );
    } else {
      this.content = (
        <div className="ProfilePage">
          <div className="ProfilePageContainer">
            <NewProfileHeader profile={this.profile} isOwner={this.isOwner} />
            <NewProfileActivity
              threads={this.threads}
              comments={this.comments}
              chains={this.chains}
              addresses={this.addresses}
            />
          </div>
        </div>
      );
    }

    return <Sublayout>{this.content}</Sublayout>;
  }
}
