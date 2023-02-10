# If url specified is other docker container, then run migration script on it
if [[ ${DATABASE_URL} == "postgresql://commonwealth:edgeware@postgres/commonwealth" ]]; then
  # Replace with docker url so that db:migrate can find the db.
  sed -i "s|127.0.0.1|host.docker.internal|g" server/sequelize.json
  npx sequelize db:migrate
fi

yarn start