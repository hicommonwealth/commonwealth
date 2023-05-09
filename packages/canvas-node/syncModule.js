const DOMAIN = 'http://localhost:8080';

export const api = `${DOMAIN}/api/oplog`;

// Recent actions may not come totally ordered, so we fetch pages
// of actions and try to apply them all instead. If any of them haven't
// been seen before, we fetch more pages until no new actions are left.

export const apiToPeerHandler = async ({ status, result }, apply) => {
  const applied = [];
  for (const res of result) {
    const result = await apply(res.hash, res.action, res.session);
    if (result) applied.push(res);
  }

  if (applied.length === 0) {
    return { applied: 0, count: result.length };
  } else {
    return {
      applied: applied.length,
      count: result.length,
      next: `${DOMAIN}/api/oplog?updated_at=${
        applied[applied.length - 1].updated_at
      }`,
    };
  }
};

export const peerToApiHandler = async ({ action, session }) => {
  console.log('peerToApiHandler: pushing action to CW', action, session);
  // TODO
};
