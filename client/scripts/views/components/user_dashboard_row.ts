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
            viewCount && ( 
                m(Button, {
                  iconLeft: Icons.EYE,
                  label: viewCount,
                  compact: true,
                  outlined: false,
                })
            ), 
            likeCount && ( 
                m(Button, {
                    iconLeft: Icons.HEART,
                    label: likeCount,
                    compact: true,
                    outlined: false,
                })
            ), 
            commentCount && ( 
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


const ActivityHeader: m.Component<{
    categoryId: string;
    activityData: Object
}> = {
    view: (vnode) => {
        const {categoryId, activityData} = vnode.attrs;

        console.log(categoryId, activityData)

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
        const category = vnode.attrs.notification.categoryId;
    
        return m('.UserDashboardRow', {}, [
            m('.activity-content', [
                m(ActivityHeader, {
                    categoryId: category,
                    activityData: JSON.parse(vnode.attrs.notification.data)
                })
            ]),
            m('.icon-row', [
                m(ButtonRow, {path: ''}),
                m(ActivityIcons, {
                    viewCount: 10,
                    commentCount: null,
                    likeCount: 10
                })

            ])
        ])
    }
}

export default UserDashboardRow;