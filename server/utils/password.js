const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}
module.exports = { hashPassword, comparePassword, isBcryptHash };