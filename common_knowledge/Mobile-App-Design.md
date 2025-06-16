# Mobile App Design

This is an overview of the design of the mobile app, how it interacts with 
Privy, Knock, Expo, etc.

# Hosted Webapp

We use an internal Webview to host our main webapp and then adjust the UI
depending on the screen size.

We simply load https://common.xyz within the Webapp and it works as an embedded
browser.

## React Native Bridge

The main problem is how do we handle communicating local mobile app services 
to the browser.

This would be messaging, auth, etc.

There's a 'bridge' that exists between react-native and the webview which 
uses postMessage and a 'message' listener.

It support bi-directional communication so you can use postMessage from the
browser into react-native or vice versa.

## RPC system

For Privy, we needed something more complicated because RPC messages between
both systems were more complicated.  

This is implemented with useMobileRPCSender and useMobileRPCReceiver.

These pass Result objects back and forth and implements Promise 
functions/callbacks you can use which also support throwing Errors.

# Privy

See Privy-Auth-Design.md

# Knock

Privy and Knock work together because Knock needs to know your uid to be able 
to listen and send notifications.

I implemented that via a hook in the frontend which listens to the user, via
useUserStore, and every time it changes, I broadcast the uid to react-native
via the react native bridge.

It sends it as 0 AKA null when the user is logged out which means the user 
*stops* receiving notifications on that device.

When they login again, then they have notifications.

# Debug View and Config

We build and deploy to the Apple App Store and Google Play Store but a production 
build ALSO needs to work with Frack.

Do that end we built out a 'config' system, similar to our .env on the frontend.

This system allows you to pick a named 'config' and switch to it.

That includes prod, frack, etc.

To trigger it you swipe from the bottom app, to the top, and hold for 5 seconds.

You then get a dialog to pick the config you wish to switch to.  

The config.ts file holds the config.  The config is very simple.  Only a few 
variables allow being changed.

# Repository 

The main code for the webapp is outside of the main 'commonwealth' git repo.

It's located here: 

http://github.com/hicommonwealth/commonwealth-mobile2

The reason for this, is because we can NOT use pnpm with Expo.

Expo requires us to use npm and apparently their bundler will not work with
pnpm monorepos.

I tried. It in fact, does not work.

Also, you MUST use the 'expo' package manager to install new packages.

To install you must run 'expo install' not 'npm install'.  This is because
expo maintains a list of package compatibilities and will upgrade secondary 
packages when necessary.  
