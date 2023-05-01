// Declare a handler for incoming actions from the peer-side.
// Actions will already have been verified.
const onPeerRecv = (action, session) => {
}

// Declare a handler that fetches new actions from the CW API.
const api = {
  endpoint: "http://localhost:8080/api/oplog",
  params: () => {},
  frequency: 5000,
  onPoll: (result) => {
    // Executes on poll.

    // returning true
    return true
  }
}

export { onPeerRecv, api }
