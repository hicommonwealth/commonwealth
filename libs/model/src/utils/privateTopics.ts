export const PrivateTopics = `
(
  SELECT DISTINCT ga.topic_id, m.address_id 
  FROM "GroupGatedActions" ga	JOIN "Memberships" m ON ga.group_id = m.group_id
  WHERE	ga.is_private = TRUE AND m.reject_reason IS NULL
) PrivateTopics
`;
