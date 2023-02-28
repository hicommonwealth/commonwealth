## Developing for iOS and Android with Capacitor

Make sure you are using the correct version of Node using NVM.

NOTE: If your shell isn't configured to automatically check .nvmrc and
set the node environment, you should run this in *every* new shell.

```
nvm use
```

### Create build directories for iOS and Android

For iOS development, you will need to use xcode-select and install
XCode or XCodeTerminal.

For Android, you will need to download and install Android Studios.

```
npx cap add ios
npx cap add android
```

If you get an error, you may need to edit the Podfile to account for
the NPM package structure, In `ios/App/Podfile` on line 1, replace the
../../ with ../../../../ and then run `npx cap update` again:

```
sed -i '1 s'#..\/..\/#..\/..\/..\/..\/#' Podfile
npx cap update ios
```

### Install dependencies

Install pods:

```
cd ios/App
pod install
```

Now return to the `packages/commonwealth` directory, and start the
mobile app server. You may want to reinstall dependencies before:

```
yarn install
NODE_ENV=mobile yarn start
```

### Running the app in a simulator

Use the following `yarn` commands to build the `client` directory
and start the simulator:

```
yarn build-ios
SERVER_URL=http://127.0.0.1:8080 yarn start-ios
```

```
yarn build-android
SERVER_URL=http://127.0.0.1:8080 yarn start-android
```

By default, we run the simulator with `NODE_ENV=mobile` which will
live-reload the client for changes, but will not live-reload the
server.  So any changes to the servers will require a rebuild/restart.

You may need to edit the `server.url` entry in `capacitor.config.ts`
for case `mobile` with the your device external IP address.

### Developing the app in Xcode

To open the app in Xcode or Android Studio:

```
npx cap open ios
npx cap open android
```

### Debugging (iOS)

To open the debugger, go to Safari, with Developer mode enabled in
settings. You can open an inspector for the iOS Simulator from the
Develop menu.

To turn off minification, go to webpack.config.mobile.js, and
inside module.exports, set `optimization: { minimize: false }`
