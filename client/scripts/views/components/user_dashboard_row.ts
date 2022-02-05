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
import { Notification, AddressInfo, NotificationCategory, DashboardNotification } from 'models';
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

const getCommentPreview = (comment_text) => {
  let decoded_comment_text;
  try {
    const doc = JSON.parse(decodeURIComponent(comment_text));
    if (!doc.ops) throw new Error();
    decoded_comment_text = m(QuillFormattedText, {
      doc,
      hideFormatting: true,
      collapse: true,
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


// Discuss, Share, and Subscribe Buttons
const ButtonRow: m.Component<{
    path: string;
}> = {
    view: (vnode) => {
        const {path} = vnode.attrs;
        return m('.icon-row-left', [
            m(Button, {
              label: "discuss",
              buttonSize: 'sm',
              iconLeft: Icons.PLUS,
              rounded: true,
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
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
                e.preventDefault();
                e.stopPropagation();
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
    activityData: any
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
        } = JSON.parse(vnode.attrs.activityData.data);

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

        if (comment_text) { // New Comment

          return m('.new-comment', [
            m("span.header", [
              actorName,
              m("span.comment-counts", [
                numericalCommentCount > 1 ? 
                ["and ", numericalCommentCount - 1, " others"] : '',
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
              
              
            ])
          ])


        }

        return actorName


        

    }
}


const UserDashboardRow: m.Component<
{
  notification: DashboardNotification;
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
        const {likeCount, viewCount, commentCount} = vnode.attrs.notification;

    
        return m('.UserDashboardRow', {
          onclick: () => console.log(vnode.attrs.notification, JSON.parse(vnode.attrs.notification.data))
        }, [
            m('.activity-content', [
                m(ActivityContent, {
                    activityData: vnode.attrs.notification
                })
            ]),
            m('.icon-row', [
                m(ButtonRow, {path: ''}),
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