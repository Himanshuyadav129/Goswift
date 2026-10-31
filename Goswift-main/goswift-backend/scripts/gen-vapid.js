// Prints a VAPID key pair for browser push. Uses only Node's built-in crypto.
const crypto = require('crypto');
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const ecdh = crypto.createECDH('prime256v1');
ecdh.generateKeys();
const pub = ecdh.getPublicKey();
const priv = ecdh.getPrivateKey();
const priv32 = Buffer.concat([Buffer.alloc(32 - priv.length), priv]);

console.log('Paste these into your backend .env (keep the private key secret):\n');
console.log(`VAPID_PUBLIC_KEY=${b64url(pub)}`);
console.log(`VAPID_PRIVATE_KEY=${b64url(priv32)}`);