web: ts-node -P tsconfig.node.json -T server.ts
worker: RUN_AS_LISTENER=true ts-node --project tsconfig.node.json server.ts
release: npx sequelize db:migrate --debug