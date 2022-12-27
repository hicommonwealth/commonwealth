import swagger_autogen from 'swagger-autogen';

const swaggerAutogen = swagger_autogen();

const doc = {
  info: {
    title: 'My API',
    description: 'Description',
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = '../server/swagger_output.json';
const endpointsFiles = ['../server/routing/external.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc);