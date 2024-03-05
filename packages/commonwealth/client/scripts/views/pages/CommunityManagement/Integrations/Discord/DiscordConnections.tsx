import React, { useState } from 'react';
import app from '../../../../../state/index';
import { CWDropdown } from '../../../../components/component_kit/cw_dropdown';
import { CWClose } from '../../../../components/component_kit/cw_icons/cw_icons';
import { CWText } from '../../../../components/component_kit/cw_text';
import { openConfirmation } from '../../../../modals/confirmation_modal';

type DiscordChannels = {
  channelName: string;
  channelId: string;
  onConnect: (topicId: string) => void;
};

export const DiscordConnections = ({
  channels,
  topics,
  refetchTopics,
}: {
  channels: DiscordChannels[];
  topics: { id: string; name: string; channelId: string | null }[];
  refetchTopics: () => Promise<void>;
}) => {
  const topicOptions = topics.map((topic) => {
    return { label: topic.name, value: topic.id };
  });

  const connectedTopics = topics.filter(
    (topic) => topic.channelId !== null && topic.channelId !== '',
  );

  const [connectionVerified, setConnectionVerified] = useState(true);

  const removeConnection = (topicId: string) => {
    openConfirmation({
      title: 'Warning',
      // eslint-disable-next-line max-len
      description: `Are you sure you want to remove this connection? New comments on Discord threads will NOT be updated on Commonwealth.`,
      buttons: [
        {
          label: 'Remove',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await app.discord.setForumChannelConnection(topicId, null);
              setConnectionVerified(false);
              await refetchTopics();
              setConnectionVerified(true);
            } catch (e) {
              console.log(e);
            }
          },
        },
        {
          label: 'No',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  return (
    <div className="DiscordConnections">
      {channels.length > 0 ? (
        <div className="TopicRow">
          <CWText className="HeaderText">Channel</CWText>
          <CWText>Topic</CWText>
        </div>
      ) : (
        <CWText>Add a forum channel in your Discord server</CWText>
      )}

      {channels.map((channel) => {
        const connectedTopic = topics.find(
          (topic) => topic.channelId === channel.channelId,
        );

        const remainingTopics = topicOptions.filter(
          (topic) =>
            !connectedTopics.find(
              (connected_topic) => connected_topic.id === topic.value,
            ),
        );

        if (connectedTopic) {
          remainingTopics.push({
            label: connectedTopic.name,
            value: connectedTopic.id,
          });
        }

        return (
          <div key={channel.channelId} className="TopicRow">
            <CWText className="ChannelText">#{channel.channelName}</CWText>
            {connectionVerified && (
              <CWDropdown
                initialValue={
                  connectedTopic
                    ? { label: connectedTopic.name, value: connectedTopic.id }
                    : { label: 'Not connected', value: '' }
                }
                options={remainingTopics}
                onSelect={async (item) => {
                  // Connect the channel to the topic
                  channel.onConnect(item.value);
                }}
              />
            )}
            {connectedTopic && (
              <CWClose
                className="CloseButton"
                onClick={() => {
                  removeConnection(connectedTopic.id);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
