cw-up: 
	docker-compose up -d --force-recreate cw-server

cw-down:
	docker-compose down cw-server

logs:
	docker-compose logs -f 

install-cw: 
	docker-compose run --rm cw-server "yarn install"

into-cw:
	docker-compose run --rm cw-server 

unrootify:
	sudo chown -R $${id -u}:$${id -g} .

