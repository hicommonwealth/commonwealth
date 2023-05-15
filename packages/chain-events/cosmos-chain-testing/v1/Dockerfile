# Simple usage with a mounted data directory:
# > docker build -t simapp .
#
# Server:
# > docker run -it -p 26657:26657 -p 26656:26656 -v ~/.simapp:/root/.simapp simapp simd init test-chain
# TODO: need to set validator in genesis so start runs
# > docker run -it -p 26657:26657 -p 26656:26656 -v ~/.simapp:/root/.simapp simapp simd start
#
# Client: (Note the simapp binary always looks at ~/.simapp we can bind to different local storage)
# > docker run -it -p 26657:26657 -p 26656:26656 -v ~/.simappcli:/root/.simapp simapp simd keys add foo
# > docker run -it -p 26657:26657 -p 26656:26656 -v ~/.simappcli:/root/.simapp simapp simd keys list
# TODO: demo connecting rest-server (or is this in server now?)

FROM golang:1.19-alpine AS build-env

# Install minimum necessary dependencies
ENV PACKAGES curl make git libc-dev bash gcc linux-headers eudev-dev python3 py3-pip build-base dasel nginx
RUN apk add --no-cache $PACKAGES && apk add --update ca-certificates

# Set working directory for the build
WORKDIR /go/src/github.com/cosmos

ENV ENABLE_PROXY 1
# Add source files
RUN curl -sSL https://github.com/cosmos/cosmos-sdk/archive/refs/tags/v0.46.11.tar.gz | tar -xz \
&& mv cosmos-sdk-0.46.11 cosmos-sdk

WORKDIR /go/src/github.com/cosmos/cosmos-sdk
# Build the binary
# Copy over binaries from the build-env
RUN make build \
    && cp /go/src/github.com/cosmos/cosmos-sdk/build/simd /usr/bin/simd

WORKDIR /root

# ADD https://simd-binary.s3.amazonaws.com/simd /usr/bin/simd
# COPY simd /usr/bin/simd

EXPOSE ${PORT}
EXPOSE 5050
COPY nginx.conf /etc/nginx/nginx.conf
COPY bootstrap.sh  bootstrap.sh
RUN chmod +x bootstrap.sh && chmod +x /usr/bin/simd && mkdir -p /run/nginx

# Run simd by default, omit entrypoint to ease using container with simcli
CMD ["sh", "-c", "sh ./bootstrap.sh"]
