#!/bin/bash

rm -rf temp && mkdir -p temp && cd temp || exit 1

# Initialize fern with openapi and copy/replace the generated file
fern init --openapi http://localhost:8080/api/v1/openapi.json && \
cp -f fern/openapi/openapi.yml ../fern/openapi/openapi.yml

cd .. && rm -rf temp