FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
## needed for node-gyp to build
RUN apt-get update && \
    apt-get install -y python3 make gcc g++
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm deploy --filter=commonwealth --prod /prod/commonwealth
RUN mv /usr/src/app/packages/commonwealth/build /prod/commonwealth/build

FROM base AS commonwealth
COPY --from=build /prod/commonwealth /prod/commonwealth
WORKDIR /prod/commonwealth
EXPOSE 8080
CMD ["node", "--import=extensionless/register", "--enable-source-maps", "./build/server.js"]

# If we plan on moving more applications to docker:
# 1. Add a line in the Dockerfile build stage to deploy that package
# 2. Write a new separate stage with an alias we can use to reference that specific application