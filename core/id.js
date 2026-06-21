'use strict';

const { monotonicFactory } = require('ulid');
const ulid = monotonicFactory();

function generateId() {
  return ulid();
}

module.exports = { generateId };
