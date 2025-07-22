# Step 1: Populate DB with content
FROM postgres:15.13 as builder

ENV POSTGRES_USER=commonwealth
ENV POSTGRES_PASSWORD=commonwealth
ENV POSTGRES_DB=edgeware

COPY . .

RUN psql -h localhost -d commonwealth -U commonwealth -f latest.dump



#RUN chmod +x init.sh && \
#    docker-entrypoint.sh postgres & \
#    sleep 5 && \
#    until pg_isready; do sleep 1; done && \
#    ./init.sh && \
#    sleep 2 && \
#    pg_ctl -D /var/lib/postgresql/data -m fast stop
#
## Step 2: Cut down file added to db
#FROM postgres:15.13
#
#COPY --from=builder /var/lib/postgresql/data /var/lib/postgresql/data