// Declare a handler for incoming actions from the peer-side.
// Actions will already have been verified.
const onPeerRecv = (action, session) => {};

// Declare a handler that fetches new actions from the CW API.
const api = {
  frequency: 5000,
  endpoint: (cursor) => {
    return (
      'http://localhost:8080/api/oplog' +
      (cursor === undefined ? '' : `?updated_at=${cursor.updated_at}`)
    );
  },
  onPoll: async (response, apply) => {
    const { status, result } = response;

    // Recent actions may not come totally ordered, so we fetch the last X
    // results, try to apply them all, and optionally look for more.
    const applied = [];
    for (const res of result) {
      if (await apply(res.hash, res.action, res.session)) {
        applied.push(res);
      }
    }
    // TODO: Better to avoid blocking here, and let the action processing queue handle async instead.
    // const applied = result.filter((res) =>
    //   apply(res.hash, res.action, res.session)
    // );

    // If all results have been seen before (successfullyApplied = false) then
    // we're done. Otherwise, advance to the earliest value of updated_at.
    if (applied.length === 0) {
      return null;
    }
    const earliestApplied = applied[applied.length - 1];
    return { updated_at: earliestApplied.updated_at };

    // TODO: Instead of using setInterval, we should advance the cursor
    // until running out of results, using setTimeout after each query.
  },
};

export { onPeerRecv, api };
