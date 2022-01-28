/* @jsx m */

import 'pages/chat.scss';

import m from 'mithril';

import { List, ListItem } from 'construct-ui';

interface IAttrs {
  channels: {
      id: number,
      name: string,
      unread: number
  }[];
  handleClick: (any: any) => void;
  activeChannel: number;
}

const channelToItem = (channel, onClick, activeChannel) => {
    return <ListItem
      class="channel-list-item"
      key={channel.id}
      label={channel.name}
      onclick={() => {onClick(channel.id)}}
      selected={channel.id === activeChannel}
    ></ListItem>
}

const ChannelBar: m.Component<IAttrs, never> = {
  view: (vnode) => {
    const { channels, handleClick, activeChannel } = vnode.attrs;

    return <div class="channel-bar">
        <div class="channel-bar-header"></div>
        <List class="channel-list">
            {channels.map(c => channelToItem(c, handleClick, activeChannel))}
        </List>
    </div>

  },
};

export default ChannelBar