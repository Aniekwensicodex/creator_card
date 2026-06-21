'use strict';

const { AppError } = require('../core/errors');
const { sendError } = require('../core/response');
const { appLogger } = require('../core/logger');

/**
 * Handle malformed JSON bodies
 */
function jsonParseErrorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'Invalid JSON in request body', 'INVALID_REQ', 400);
  }
  next(err);
}

/**
 * Global error handler - catches anything not caught in route handlers
 */
function globalErrorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.code, err.httpStatus);
  }

  appLogger.errorX(err, 'unhandled');
  return sendError(res, 'An unexpected error occurred', 'APP_ERR', 500);
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res) {
  return sendError(res, `Route ${req.method} ${req.path} not found`, 'NOTFOUND', 404);
}

module.exports = { jsonParseErrorHandler, globalErrorHandler, notFoundHandler };
