/*
 * When viewing actor is authenticated (address_id and community_id are defined)
 * - Gets all community topics, public or private where the viewer is a member
 * ...otherwise, gets all private topics to be excluded
 */
export function withGates(address_id?: number) {
  return address_id
    ? `
WITH OpenGates AS (
  SELECT DISTINCT T.id as topic_id
  FROM
  	"Topics" T
  	LEFT JOIN "GroupGatedActions" G ON T.id = G.topic_id
  	LEFT JOIN "Memberships" M ON G.group_id = M.group_id
      AND M.address_id = :address_id
      AND M.reject_reason IS NULL
  WHERE
  	T.community_id = :community_id
  	AND (COALESCE(G.is_private, FALSE) = FALSE OR M.address_id IS NOT NULL)
)
`
    : `
WITH PrivateGates AS (
  SELECT DISTINCT topic_id
  FROM "GroupGatedActions"
  WHERE	is_private = TRUE
)
`;
}

export function joinGates(address_id?: number) {
  return address_id
    ? 'JOIN OpenGates ON T.topic_id = OpenGates.topic_id'
    : 'LEFT JOIN PrivateGates ON T.topic_id = PrivateGates.topic_id';
}

export function filterGates(address_id?: number) {
  return address_id ? '' : 'AND PrivateGates.topic_id IS NULL';
}
