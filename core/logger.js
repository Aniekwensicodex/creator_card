'use strict';

const appLogger = {
  info(data, key) {
    console.log(JSON.stringify({ level: 'info', key, ...data, time: new Date().toISOString() }));
  },
  warn(data, key) {
    console.warn(JSON.stringify({ level: 'warn', key, ...data, time: new Date().toISOString() }));
  },
  error(data, key) {
    console.error(JSON.stringify({ level: 'error', key, ...data, time: new Date().toISOString() }));
  },
  errorX(error, key) {
    console.error(JSON.stringify({
      level: 'error',
      key,
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString(),
    }));
  },
};

module.exports = { appLogger };
