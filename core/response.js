'use strict';

function sendSuccess(res, data, message, statusCode = 200) {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
}

function sendError(res, message, code, statusCode = 400) {
  return res.status(statusCode).json({
    status: 'error',
    message,
    code,
  });
}

module.exports = { sendSuccess, sendError };
