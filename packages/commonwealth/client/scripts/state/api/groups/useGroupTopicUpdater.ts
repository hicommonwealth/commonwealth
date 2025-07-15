import { GatedActionEnum } from '@hicommonwealth/shared';
import app from 'state';
import { fetchGroupById } from 'state/api/groups/fetchGroupById';

export interface GroupTopic {
  id: number;
  is_private: boolean;
  name?: string;
  permissions?: GatedActionEnum[];
}

export async function updateGroupTopicsBulk({
  groupIds,
  topicId,
  name,
  editGroup,
  remove = false,
}: {
  groupIds: number[];
  topicId: number;
  name?: string;
  editGroup: (args: any) => Promise<any>;
  remove?: boolean;
}) {
  for (const groupId of groupIds) {
    const latestGroups = await fetchGroupById(groupId);
    const latestGroup = latestGroups?.[0];
    const existingTopics: GroupTopic[] = (latestGroup?.topics || [])
      .filter((t) => typeof t.id === 'number')
      .map((t) => ({
        id: t.id as number,
        is_private: t.is_private,
        name: t.name,
        permissions: t.permissions,
      }));

    let newTopics: GroupTopic[];
    if (remove) {
      newTopics = existingTopics.filter((t) => t.id !== topicId);
    } else {
      newTopics = [
        ...existingTopics.filter((t) => t.id !== topicId),
        { id: topicId, is_private: true, name },
      ];
    }

    await editGroup({
      community_id: app.activeChainId() || '',
      group_id: groupId,
      topics: newTopics.map((t) => ({
        id: t.id,
        is_private: t.is_private,
        permissions: Array.isArray(t.permissions)
          ? t.permissions
          : Object.values(GatedActionEnum),
      })),
    });
  }
}
