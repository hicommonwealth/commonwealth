web: ts-node -P tsconfig.node.json -T server.ts
worker: RUN_AS_LISTENER=true ts-node --log-error --project tsconfig.node.json server.ts
release: PGSSLMODE=no-verify npx sequelize-cli --url $DATABASE_URL db:migrate
