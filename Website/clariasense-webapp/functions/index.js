const functions = require('firebase-functions');
const next = require('next');

const app = next({ dev: false, conf: { distDir: 'next' } });
const handle = app.getRequestHandler();

exports.nextApp = functions.https.onRequest(async (req, res) => {
  await app.prepare();
  return handle(req, res);
});
