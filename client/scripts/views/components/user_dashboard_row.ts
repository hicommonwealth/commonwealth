import 'components/user_dashboard_row.scss';

import { Icon, Icons, Button, MenuItem, PopoverMenu } from 'construct-ui';
import _ from 'lodash';
import m from 'mithril';
import moment from 'moment';
import {
  SubstrateEvents,
  MolochEvents,
  IEventLabel,
  SupportedNetwork,
  CompoundEvents,
  AaveEvents,
  // CompoundEvents
} from '@commonwealth/chain-events';

import app from 'state';
import { NotificationCategories, ProposalType } from 'types';
import { Notification, AddressInfo, NotificationCategory, DashboardActivityNotification } from 'models';
import { link, pluralize } from 'helpers';
import { IPostNotificationData } from 'shared/types';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import User from 'views/components/widgets/user';

import { getProposalUrl, getCommunityUrl } from '../../../../shared/utils';
import { CWEngagementButton } from './component_kit/cw_engagement_button';
import { NumberList } from 'aws-sdk/clients/iot';
import { Category } from 'typescript-logging';
import { notifySuccess } from 'controllers/app/notifications';

const getCommentPreview = (comment_text) => {
  let decoded_comment_text;
  try {
    const doc = JSON.parse(decodeURIComponent(comment_text));
    if (!doc.ops) throw new Error();
    decoded_comment_text = m(QuillFormattedText, {
      doc,
      hideFormatting: true,
      collapse: false,
    });
  } catch (e) {
    let doc = decodeURIComponent(comment_text);
    const regexp = RegExp('\\[(\\@.+?)\\]\\(.+?\\)', 'g');
    const matches = doc['matchAll'](regexp);
    Array.from(matches).forEach((match) => {
      doc = doc.replace(match[0], match[1]);
    });
    decoded_comment_text = m(MarkdownFormattedText, {
      doc: doc.slice(0, 140),
      hideFormatting: true,
      collapse: true,
    });
  }
  return decoded_comment_text;
};

// Subscriptions
const subscribeToThread = async (thread_id: string) => {
  const adjusted_id = "discussion_" + thread_id;
  const commentSubscription = app.user.notifications.subscriptions
    .find((v) => v.objectId === adjusted_id && v.category === NotificationCategories.NewComment);
  const reactionSubscription = app.user.notifications.subscriptions
    .find((v) => v.objectId === adjusted_id && v.category === NotificationCategories.NewReaction);
  const bothActive = (commentSubscription?.isActive && reactionSubscription?.isActive);

  if (bothActive) {
    await app.user.notifications.disableSubscriptions([commentSubscription, reactionSubscription]);
      notifySuccess('Unsubscribed!');
  } else if (!commentSubscription || !reactionSubscription) {
    await Promise.all([
      app.user.notifications.subscribe(NotificationCategories.NewReaction, adjusted_id),
      app.user.notifications.subscribe(NotificationCategories.NewComment, adjusted_id),
    ]);
    notifySuccess('Subscribed!');
  } else {
    await app.user.notifications.enableSubscriptions([commentSubscription, reactionSubscription]);
    notifySuccess('Subscribed!');
  }
}


// Discuss, Share, and Subscribe Buttons
const ButtonRow: m.Component<{
    path: string;
    thread_id: string;
}> = {
    view: (vnode) => {
        const {path, thread_id} = vnode.attrs;
        
        return m('.icon-row-left', [
            m(Button, {
              label: "discuss",
              buttonSize: 'sm',
              iconLeft: Icons.PLUS,
              rounded: true,
              onclick: (e) => {
                e.stopPropagation();
                m.route.set(path);
              },
            }),
            m('.share-button', {
              onclick: (e) => {
                e.stopPropagation();
              }
            }, [
              m(PopoverMenu, {
                transitionDuration: 0,
                closeOnOutsideClick: true,
                closeOnContentClick: true,
                menuAttrs: { size: 'default' },
                content: [
                  m(MenuItem, {
                    iconLeft: Icons.COPY,
                    label: 'Copy URL',
                    onclick: async (e) => {
                      await navigator.clipboard.writeText(path);
                    },
                  }),
                  m(MenuItem, {
                    iconLeft: Icons.TWITTER,
                    label: 'Share on Twitter',
                    onclick: async (e) => {
                      await window.open(`https://twitter.com/intent/tweet?text=${path}`, '_blank');
                    }
                  }),
                ],
                trigger: m(Button, {
                  buttonSize: 'sm',
                  label: 'share',
                  iconLeft: Icons.SHARE,
                  rounded: true,
                  onclick: (e) => {},
                }),
              }),
            ]),
            m(Button, {
              buttonSize: 'sm',
              label: 'subscribe',
              iconLeft: Icons.BELL,
              rounded: true,
              onclick: (e) => {
                e.stopPropagation();
                subscribeToThread(thread_id);
              },
            }),
          ])
    }
}

// The Likes, Comments, Views Counters
const ActivityIcons: m.Component<{
    viewCount: number | null;
    likeCount: number | null;
    commentCount: number | null;
}> = {
    view: (vnode) => {
        const {viewCount, likeCount, commentCount} = vnode.attrs;

        return m('.icon-row-right', [
            viewCount && viewCount > 0 && ( 
                m(Button, {
                  iconLeft: Icons.EYE,
                  label: viewCount,
                  compact: true,
                  outlined: false,
                })
            ), 
            likeCount && likeCount > 0 && ( 
                m(Button, {
                    iconLeft: Icons.HEART,
                    label: likeCount,
                    compact: true,
                    outlined: false,
                })
            ), 
            commentCount && commentCount > 0 && ( 
                m(Button, {
                    iconLeft: Icons.MESSAGE_SQUARE,
                    label: commentCount,
                    compact: true,
                    outlined: false,
                })
            ), 
        ])
    }
}


const ActivityContent: m.Component<{
    activityData: any;
    category: string;
}> = {
    view: (vnode) => {
        const {
          created_at,
          chain_id,
          root_id, 
          root_title, 
          author_chain,
          author_address, 
          comment_text, 
          root_type,
        } = JSON.parse(vnode.attrs.activityData.notification_data);

        const {likeCount, viewCount, commentCount} = vnode.attrs.activityData;
        
        const numericalCommentCount = parseInt(commentCount);

        const community_name = app.config.chains.getById(chain_id)?.name || 'Unknown chain';
        const decoded_title = decodeURIComponent(root_title).trim();
        const title_text = decoded_title.length > 50 ? decoded_title.slice(0, 47) + "..." : decoded_title;

        // Get Author of Notification
        const actorName = m(User, {
          user: new AddressInfo(null, author_address, author_chain ?? chain_id, null),
          hideIdentityIcon: false,
          linkify: true,
          onclick: (e: any) => {
            e.preventDefault();
            e.stopPropagation();
            m.route.set(`/${author_chain}/account/${author_address}`);
          },
        });


        if (vnode.attrs.category === 'new-comment-creation') { // New Comment
          return m('.new-comment', [
            m("span.header", [
              actorName,
              m("span.comment-counts", [
                numericalCommentCount > 1 ? 
                [" and ", numericalCommentCount - 1, " others"] : '',
                " commented on ",
              ]),
              m('span.community-title', [
                title_text,
              ]),
              m("span.comment-counts", [" in "]),
              m('span.community-link', {
                onclick: (e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  m.route.set(`/${chain_id}`)
                }
              }, [community_name])
            ]),
            m(".comment-body-concat", [
              getCommentPreview(comment_text)
            ])
          ])
        } else if (vnode.attrs.category === 'new-thread-creation') {
          return m('.new-comment', [
            m("span.header", [
              actorName,
              m("span.comment-counts", [
                " created new thread ",
              ]),
              m('span.community-title', [
                title_text,
              ]),
              m("span.comment-counts", [" in "]),
              m('span.community-link', {
                onclick: (e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  m.route.set(`/${chain_id}`)
                }
              }, [community_name])
            ]),
            
          ])
        }
        return actorName
    }
}


const UserDashboardRow: m.Component<
{
  notification: DashboardActivityNotification;
  onListPage?: boolean;
},
{
  Labeler: any;
  MolochTypes: any;
  SubstrateTypes: any;
  scrollOrStop: boolean;
  markingRead: boolean;
}
> = {
    view: (vnode) => {
        const {likeCount, viewCount, commentCount, categoryId, thread_id, createdAt, typeId, updatedAt, blockNumber, chainEventId} = vnode.attrs.notification;

        // ----------- Handle Chain Events ----------- //
        if (categoryId === 'chain-event') {
          const {
            // Fill in with what we need

          } = vnode.attrs.notification.eventData;

          return;
        }
        
        // ----------- Handle Notifications ----------- //
        const {
          created_at,
          chain_id,
          root_id, 
          root_title, 
          author_chain,
          author_address, 
          comment_text, 
          root_type,
        } = JSON.parse(vnode.attrs.notification.notification_data);

        // Get Path to Proposal
        const pseudoProposal = {
          id: root_id,
          title: root_title,
          chain: chain_id,
        };
        const args = [root_type, pseudoProposal];
        const path = (getProposalUrl as any)(...args);
    
        return m('.UserDashboardRow', {
          onclick: () => {
            m.route.set(path);
            m.redraw();
          }
        }, [
            m('.activity-content', [
              //vnode.attrs.notification.categoryId === ''
                m(ActivityContent, {
                    activityData: vnode.attrs.notification,
                    category: categoryId
                })
            ]),
            m('.icon-row', [
                m(ButtonRow, {path, thread_id}),
                m(ActivityIcons, {
                    viewCount,
                    commentCount,
                    likeCount
                })

            ])
        ])
    }
}

export default UserDashboardRow;