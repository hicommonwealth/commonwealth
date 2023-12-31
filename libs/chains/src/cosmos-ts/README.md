# Cosmos SDK Types and LCD Client

This package was generated using [Telescope](https://docs.osmosis.zone/telescope/).

It is currently used as a patch to support `gov` module `v1`, as cosmJS does not yet support it. Once 
[this issue in cosmjs-types](https://github.com/confio/cosmjs-types/issues/32) is completed, we can re-assess.
We may be able to delete this cosm-ts package and go back to only using cosmJS.


# If you need to regenerate these types

- Clone [telescope](https://github.com/osmosis-labs/telescope) in a separate local repo
- Follow the instructions below to generate a new Typescript package that you can publish to npm.

First, install telescope:

`npm install -g @osmonauts/telescope`

Generate
Use the generate command to create a new package.

```
telescope generate
cd ./your-new-project
yarn 
```

Add Protobufs

`telescope install @protobufs/cosmos`

Transpile
To create the Typescript files, set up your `codegen.js` file in this configuration:

```
import { join } from 'path';
import telescope from '@osmonauts/telescope';
import { sync as rimraf } from 'rimraf';
import { AMINO_MAP } from './aminos';

const protoDirs = [join(__dirname, '/../proto')];
const outPath = join(__dirname, '../src/codegen');
rimraf(outPath);

telescope({
  protoDirs,
  outPath,
  options: {
    tsDisable: {
      files: [
        'cosmos/authz/v1beta1/tx.amino.ts',
        'cosmos/staking/v1beta1/tx.amino.ts',
      ],
    },
    prototypes: {
      includePackageVar: false,
      typingsFormat: {
        useDeepPartial: false,
        useExact: false,
        timestamp: 'date',
        duration: 'string',
      },
      methods: {
        toJSON: false,
        fromJSON: false,
        fromSDK: false,
        toSDK: false,
      },
    },
    aminoEncoding: {
      enabled: true,
      exceptions: AMINO_MAP,
    },
    lcdClients: {
      enabled: true,
      bundle: false,
      scoped: [
        {
          dir: 'cosmos',
          packages: ['cosmos.gov.v1'],
          addToBundle: false,
        },
      ],
    },
    rpcClients: {
      enabled: false,
    },
  },
})
  .then(() => {
    console.log('✨ all done!');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```
then,
`yarn codegen`

You should now seem some .ts files generated in ./src/codegen. These are the real source files used in your application.

This gives you all the Cosmos modules, but we only need `gov` and its dependencies.

1. In ./src/codegen/cosmos, delete every folder except `base` and `gov/v1`
2. In client.ts and bundle.ts, delete unneeded imports and exports.
3. Copy './src/codegen` and paste into `common-common/src/cosmos-ts`

Again, we should only need _these_ files, in order to instantiate the LCD client, and use gov v1.
