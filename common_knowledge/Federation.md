# Federation (WIP)

The Commonwealth forum implements federation capabilities using
libraries from [Canvas](https://docs.canvas.xyz).

This means that forum actions are signed using the users' wallet
address, with one level of delegation (the user authorizes a session
key when they log in).

## Testing federation locally

From packages/commonwealth, run `pnpm start` to start the
application. In the log output, look for:

```
canvas: started libp2p with multiaddrs [
    /ip4/127.0.0.1/tcp/8090/ws/p2p/12D3KooWPbkvKDxziibMP3cxrQP7NNnZCDNfj2cT3Ej3TH23wWBS
]
```

In another terminal, use the libp2p multiaddr to start a node:

```
canvas run libs/shared/src/canvas/runtime/contract.ts --bootstrap /ip4/127.0.0.1/tcp/8090/ws/p2p/12D3KooWPbkvKDxziibMP3cxrQP7NNnZCDNfj2cT3Ej3TH23wWBS
```

As you interact with Commonwealth
(i.e. creating/editing/deleting of threads/comments/reactions), you
should see both sessions and actions being pushed to the federation
node running in the CLI.

Now, try sending an action from the CLI:

```
> thread({ community: 'hi', title: 'hi', body: 'hello world', link: '', topic: 'g' })
creating a session
sending thread([object Object])
```

Since typed autocomplete isn't working in the CLI yet, you might have
to provide empty strings or encode `undefined` as `null` when sending
actions from the CLI.

This will *not* currently push new interactions to Commonwealth. Once
the API handlers are complete in the other direction (this is part of the
API refactor), then interactions sent from the command line will also
appear in the forum.
