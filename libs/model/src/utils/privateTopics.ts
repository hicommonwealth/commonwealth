/*
 * Used to filter out threads that are private to the viewing address
 * IMPORTANT: The replacements object should contain an `address_id` key
 */
export function joinPrivateTopics(address_id?: number) {
  return address_id
    ? `
LEFT JOIN "GroupGatedActions" Gates ON T.topic_id = Gates.topic_id
LEFT JOIN "Memberships" Actor ON
  Gates.group_id = Actor.group_id
  AND Gates.is_private = TRUE
  AND Actor.address_id = :address_id
  AND Actor.reject_reason IS NULL
`
    : 'LEFT JOIN "GroupGatedActions" Gates ON T.topic_id = Gates.topic_id';
}

/*
 * IMPORTANT: this function should be used in conjunction with joinPrivateTopics
 */
export function filterPrivateTopics(address_id?: number) {
  return address_id
    ? `
AND (
    COALESCE(Gates.is_private, FALSE) = FALSE  
    OR Actor.address_id IS NOT NULL
)` // public + viewer's private topics
    : 'AND COALESCE(Gates.is_private, FALSE) = FALSE'; // only include public gates
}
