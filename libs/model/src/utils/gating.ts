import { Actor } from '@hicommonwealth/core';
import { ALL_COMMUNITIES } from '@hicommonwealth/shared';

const bypassGates = (actor: Actor) =>
  actor.user?.isAdmin || ['admin', 'moderator'].includes(actor.role || '');

const gateCommunity = (actor: Actor) =>
  actor.address_id &&
  actor.community_id &&
  actor.community_id !== ALL_COMMUNITIES;

/*
 * When viewing actor is authenticated (address_id and community_id are defined)
 * - Gets all community topics, public or private where the viewer is a member
 * ...otherwise, gets all private topics to be excluded
 */
export function withGates(actor: Actor) {
  return bypassGates(actor)
    ? 'WITH Dummy AS (SELECT 1 as topic_id)'
    : gateCommunity(actor)
      ? `
WITH OpenGates AS (
  SELECT T.id as topic_id
  FROM
  	"Topics" T
  	LEFT JOIN "GroupGatedActions" G ON T.id = G.topic_id
  	LEFT JOIN "Memberships" M ON G.group_id = M.group_id
      AND M.address_id = :address_id
      AND M.reject_reason IS NULL
  WHERE
  	T.community_id = :community_id
  GROUP BY
    T.id
  HAVING
    BOOL_AND(
      COALESCE(G.is_private, FALSE) = FALSE
      OR M.address_id IS NOT NULL
    )
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

export function joinGates(actor: Actor) {
  return bypassGates(actor)
    ? ''
    : gateCommunity(actor)
      ? 'JOIN OpenGates ON T.topic_id = OpenGates.topic_id'
      : 'LEFT JOIN PrivateGates ON T.topic_id = PrivateGates.topic_id';
}

export function filterGates(actor: Actor) {
  return bypassGates(actor) || gateCommunity(actor)
    ? ''
    : 'AND PrivateGates.topic_id IS NULL';
}

/**
 * Gates topics according to the actor's group memberships
 */
export function buildOpenGates(actor: Actor) {
  return `
user_addresses AS (
  SELECT a.id FROM "Addresses" a WHERE a.user_id = ${actor.user.id}
),
open_gates AS (
  SELECT T.id as topic_id
  FROM
    user_addresses ua
    JOIN "Addresses" a ON ua.id = a.id
    JOIN "Topics" T ON a.community_id = T.community_id
  	LEFT JOIN "GroupGatedActions" G ON T.id = G.topic_id
  	LEFT JOIN "Memberships" M ON G.group_id = M.group_id
      AND M.address_id IN (SELECT id FROM user_addresses)
      AND M.reject_reason IS NULL
  GROUP BY
    T.id
  HAVING
    BOOL_AND(
      COALESCE(G.is_private, FALSE) = FALSE
      OR M.address_id IS NOT NULL
      OR ${actor.user?.isAdmin ? 'TRUE' : 'FALSE'}
    )
)
`;
}
