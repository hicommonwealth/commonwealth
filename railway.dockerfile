FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

## Workaround here https://github.com/pnpm/pnpm/issues/9029
RUN corepack prepare pnpm@9.14.2 --activate

FROM base AS build
## needed for node-gyp to build
RUN apt-get update && \
    apt-get install -y python3 make gcc g++
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN pnpm install --frozen-lockfile
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

RUN pnpm deploy -F commonwealth --prod /prod/commonwealth
RUN mv /usr/src/app/packages/commonwealth/build /prod/commonwealth/build

FROM base AS commonwealth

# Install pgroll binary with architecture detection
ARG OS=linux
RUN ARCH=$(case $(uname -m) in \
        x86_64) echo "amd64" ;; \
        aarch64|arm64) echo "arm64" ;; \
        *) echo "amd64" ;; \
    esac) && \
    # Validate OS argument
    case ${OS} in \
        linux|macos) echo "Installing pgroll for ${OS}_${ARCH}" ;; \
        *) echo "Error: OS must be either 'linux' or 'macos'" && exit 1 ;; \
    esac && \
    curl -L "https://github.com/xataio/pgroll/releases/download/v0.14.1/pgroll_0.14.1_${OS}_${ARCH}.tar.gz" | tar -xz -C /usr/local/bin/

ENV NODE_ENV=production
COPY --from=build /prod/commonwealth /prod/commonwealth
WORKDIR /prod/commonwealth
ENV PORT=$PORT