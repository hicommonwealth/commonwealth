# Essential Commands

builder:
	docker compose --file=docker-compose.init.yml build

cw-build:
	docker compose up --build 

cw:
	docker compose up

into-commonwealth:
	docker exec -it commonwealth-commonwealth-1 sh 

into-chain-events:
	docker exec -it commonwealth-chain-events-1 sh

into-db:
	docker exec -it commonwealth-db-1 sh

# DB Commands

# N.B. If your DB is ever broken, run these commands in order to reconstruct:
# 1. make reset-db
# 2. make load-db
# 3. make migrate-db

reset-db:
	docker exec -it commonwealth-commonwealth-1 sh -c "psql -h db -d postgres -U commonwealth -c 'DROP DATABASE commonwealth WITH (FORCE);' && npx sequelize db:create"

load-db:
	docker exec -it commonwealth-commonwealth-1 sh -c "psql -h db -d commonwealth -U commonwealth -W -f latest.dump"

migrate-db:
	docker exec -it commonwealth-commonwealth-1 sh -c "yarn migrate-db"

# Test Commands

api-test:
	docker exec -it commonwealth-commonwealth-1 sh -c "yarn test-api"
