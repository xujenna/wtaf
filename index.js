const { onRequest } = require('firebase-functions/v2/https');
const app = require('./server');

exports.app = onRequest(
  { memory: '512MiB', timeoutSeconds: 60, secrets: ['ANTHROPIC_API_KEY'] },
  app
);
