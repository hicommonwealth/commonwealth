/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import moment from 'moment';

import 'pages/notification_settings/index.scss';

import app from 'state';
import { modelFromServer } from 'models/NotificationSubscription';
import { AddressInfo, ChainInfo, NotificationSubscription } from 'models';
import { notifyError } from 'controllers/app/notifications';
import Sublayout from 'views/sublayout';
import { PageLoading } from '../loading';
import ErrorPage from '../error';
import { BreadcrumbsTitleTag } from '../../components/breadcrumbs_title_tag';
import { CWText } from '../../components/component_kit/cw_text';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWCollapsible } from '../../components/component_kit/cw_collapsible';
import { CWToggle } from '../../components/component_kit/cw_toggle';
import User from '../../components/widgets/user';
import { isWindowExtraSmall } from '../../components/component_kit/helpers';
import {
  SubscriptionRowTextContainer,
  SubscriptionRowMenu,
} from './helper_components';

class NotificationSettingsPage implements m.ClassComponent {
  private subscriptions: NotificationSubscription[];
  private joinedCommunities: ChainInfo[];

  async oninit() {
    if (!app.isLoggedIn()) {
      notifyError('Must be logged in to configure notifications');
      m.route.set('/');
    }

    this.subscriptions = [];

    // Should be factored into a helper
    // Also used in community_selector.tsx
    const allCommunities = app.config.chains
      .getAll()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((item) => {
        // only show chains with nodes
        return !!item.node;
      });

    // Should be factored into a helper
    // Also used in community_selector.tsx
    const isInCommunity = (item) => {
      if (item instanceof ChainInfo) {
        return app.roles.getAllRolesInCommunity({ chain: item.id }).length > 0;
      } else {
        return false;
      }
    };

    // Should be factored into a helper
    // Also used in community_selector.tsx
    this.joinedCommunities = allCommunities.filter((c) => isInCommunity(c));

    $.get(`${app.serverUrl()}/viewSubscriptions`, {
      jwt: app.user.jwt,
    }).then(
      (result) => {
        result.result.forEach((sub) =>
          this.subscriptions.push(modelFromServer(sub))
        );
        m.redraw();
      },
      () => {
        notifyError('Could not load notification settings');
        m.route.set('/');
      }
    );
  }

  view() {
    if (!app.loginStatusLoaded()) {
      return (
        <PageLoading
          title={<BreadcrumbsTitleTag title="Notification Settings" />}
        />
      );
    } else if (!app.isLoggedIn()) {
      return (
        <ErrorPage
          message="This page requires you to be logged in"
          title={<BreadcrumbsTitleTag title="Notification Settings" />}
        />
      );
    }

    // Sort communities if they have a subscription
    const sortedCommunities = this.joinedCommunities.sort((a, b) => {
      const aHasSub = this.subscriptions.filter((sub) => sub.Chain.id === a.id);
      const bHasSub = this.subscriptions.filter((sub) => sub.Chain.id === b.id);
      return bHasSub.length - aHasSub.length;
    });

    return (
      <Sublayout title={<BreadcrumbsTitleTag title="Notification Settings" />}>
        <div class="NotificationSettingsPage">
          <CWText type="h3" fontWeight="semiBold" className="page-header-text">
            Notification Management
          </CWText>
          <CWText className="page-subheader-text">
            Notification settings for all new threads, comments, mentions,
            likes, and chain events in the following communities.
          </CWText>
          <div class="column-header-row">
            <CWText
              type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'h5'}
              fontWeight="medium"
              className="column-header-text"
            >
              Community
            </CWText>
            <CWText
              type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'h5'}
              fontWeight="medium"
              className="column-header-text"
            >
              Email
            </CWText>
            <CWText
              type={isWindowExtraSmall(window.innerWidth) ? 'caption' : 'h5'}
              fontWeight="medium"
              className="last-column-header-text"
            >
              In-App
            </CWText>
          </div>
          {sortedCommunities.map((chainInfo) => {
            // Filter subscriptions to only those for this chain
            const chainSubs = this.subscriptions.filter(
              (sub) => sub.Chain.id === chainInfo.id
            );

            return (
              <div class="notification-row">
                <CWCollapsible
                  headerContent={
                    <div class="notification-row-header">
                      <div className="left-content-container">
                        <div class="avatar-and-name">
                          <CWCommunityAvatar
                            size="medium"
                            community={chainInfo}
                          />
                          <CWText type="h5" fontWeight="medium">
                            {chainInfo.name}
                          </CWText>
                        </div>
                        <CWText type="b2" className="subscriptions-count-text">
                          {chainSubs.length} subscriptions
                        </CWText>
                      </div>
                      <CWCheckbox label="Receive Emails" />
                      <CWToggle />
                    </div>
                  }
                  collapsibleContent={
                    <div class="subscriptions-list-container">
                      <div class="subscriptions-list-header">
                        <CWText
                          type="caption"
                          className="subscription-list-header-text"
                        >
                          Title
                        </CWText>
                        <CWText
                          type="caption"
                          className="subscription-list-header-text"
                        >
                          Subscribed
                        </CWText>
                        <CWText
                          type="caption"
                          className="subscription-list-header-text"
                        >
                          Author
                        </CWText>
                      </div>
                      {chainSubs.map((sub) => {
                        const getUser = () => {
                          if (sub.Thread) {
                            return m(User, {
                              user: new AddressInfo(
                                null,
                                sub.Thread.author,
                                sub.Thread.chain,
                                null
                              ),
                            });
                          } else if (sub.Comment) {
                            return m(User, {
                              user: new AddressInfo(
                                null,
                                sub.Comment.author,
                                sub.Comment.chain,
                                null
                              ),
                            });
                          } else {
                            // return empty div to ensure that grid layout is correct
                            // even in the absence of a user
                            return <div />;
                          }
                        };

                        const getTimeStamp = () => {
                          if (sub.Thread) {
                            return moment(sub.Thread.createdAt).format('l');
                          } else if (sub.Comment) {
                            return moment(sub.Comment.createdAt).format('l');
                          } else {
                            return null;
                          }
                        };

                        return (
                          <>
                            <div class="subscription-row-desktop">
                              <SubscriptionRowTextContainer
                                subscription={sub}
                              />
                              <CWText type="b2">{getTimeStamp()}</CWText>
                              {getUser()}
                              <SubscriptionRowMenu subscription={sub} />
                            </div>
                            <div class="subscription-row-mobile">
                              <div class="subscription-row-mobile-top">
                                <SubscriptionRowTextContainer
                                  subscription={sub}
                                />
                                <SubscriptionRowMenu subscription={sub} />
                              </div>
                              <div class="subscription-row-mobile-bottom">
                                {getUser()}
                                {getTimeStamp() && (
                                  <CWText
                                    type="caption"
                                    className="subscription-list-header-text"
                                  >
                                    subscribed
                                  </CWText>
                                )}
                                <CWText
                                  type="caption"
                                  fontWeight="medium"
                                  className="subscription-list-header-text"
                                >
                                  {getTimeStamp()}
                                </CWText>
                              </div>
                            </div>
                          </>
                        );
                      })}
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      </Sublayout>
    );
  }
}

export default NotificationSettingsPage;
