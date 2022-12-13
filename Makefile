builder:
	docker compose --file=docker-compose.init.yml build

cw-build:
	docker compose up --build 

cw:
	docker compose up

into-commonwealth:
	docker exec -it commonwealth-commonwealth sh 

into-chain-events:
	docker exec -it commonwealth-chain-events sh

into-db:
	docker exec -it commonwealth-db sh

migrate-db:
	docker exec -it commonwealth-commonwealth yarn migrate

reset-db:
	docker exec -it commonwealth-commonwealth sh -c "psql -h db -U postgres -c 'DROP DATABASE commonwealth;' && psql -U postgres -c 'CREATE DATABASE commonwealth;'"

load-db:
	docker exec -it commonwealth-commonwealth sh -c "psql -h db -d commonwealth -U commonwealth -W -f latest.dump"

api-test:
	docker exec -it commonwealth-commonwealth yarn test-api
