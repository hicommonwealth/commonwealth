/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import ClassComponent from 'class_component';

import 'pages/new_profile/index.scss';

import app from 'state';
import type { Thread } from 'models';
import { AddressInfo, NewProfile as Profile } from 'models';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';

import { NewProfileHeader } from './new_profile_header';
import type { CommentWithAssociatedThread } from './new_profile_activity';
import { NewProfileActivity } from './new_profile_activity';
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

const NoAddressFoundError = 'No address found';
const NoProfileFoundError = 'No profile found';

export default class NewProfile extends ClassComponent<NewProfileAttrs> {
  private address: string;
  private addresses: AddressInfo[];
  private content: m.Vnode;
  private comments: CommentWithAssociatedThread[];
  private error: ProfileError;
  private loading: boolean;
  private profile: Profile;
  private threads: Thread[];

  private getProfileData = async (address: string) => {
    try {
      const response = await $.get(`${app.serverUrl()}/profile/v2`, {
        address,
        jwt: app.user.jwt,
      });

      const { result } = response;

      this.profile = new Profile(result.profile);
      this.threads = result.threads.map((t) => app.threads.modelFromServer(t));
      const comments = result.comments.map((c) => modelCommentFromServer(c));
      const commentsWithAssociatedThread = comments.map((c) => {
        const thread = result.commentThreads.find(
          (t) =>
            t.id === parseInt(c.rootProposal.replace('discussion_', ''), 10)
        );
        return { ...c, thread };
      });
      this.comments = commentsWithAssociatedThread;
      this.addresses = result.addresses.map(
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
    } catch (err) {
      if (
        err.status === 500 &&
        err.responseJSON.error === NoAddressFoundError
      ) {
        this.error = ProfileError.NoAddressFound;
      }
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
    this.address = m.route.param('address');
    this.loading = true;
    this.error = ProfileError.None;
    this.comments = [];
    this.threads = [];
    this.getProfileData(this.address);
    this.loading = false;
  }

  view() {
    if (this.loading)
      this.content = (
        <div class="NewProfilePage">
          <div class="loading-spinner">
            <CWSpinner />
          </div>
        </div>
      );

    if (this.error === ProfileError.NoAddressFound)
      return <PageNotFound message="We cannot find this profile." />;

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
          className="NewProfilePage"
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
            <NewProfileHeader profile={this.profile} address={this.address} />
            <NewProfileActivity
              threads={this.threads}
              comments={this.comments}
              addresses={this.addresses}
            />
          </div>
        </div>
      );
    } else {
      this.content = (
        <div className="NewProfilePage">
          <div className="ProfilePageContainer">
            <NewProfileHeader profile={this.profile} address={this.address} />
            <NewProfileActivity
              threads={this.threads}
              comments={this.comments}
              addresses={this.addresses}
            />
          </div>
        </div>
      );
    }

    return <Sublayout>{this.content}</Sublayout>;
  }
}
