'use strict';

const ERROR_CODE = {
  // Auth
  AUTH_ERR: 'AUTH_ERR',
  NO_AUTH_ERR: 'NO_AUTH_ERR',
  INVALID_AUTH_TOKEN: 'INVALID_AUTH_TOKEN',
  INACTIVE_ACCT: 'INACTIVE_ACCT',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  PERM_ERR: 'PERM_ERR',
  // Request
  INVALID_REQ: 'INVALID_REQ',
  INVALID_DATA: 'INVALID_DATA',
  VALIDATION_ERR: 'VALIDATION_ERR',
  NOT_FOUND: 'NOT_FOUND',
  // Business
  DUPLR_CRD: 'DUPLR_CRD',
  LIMIT_ERR: 'LIMIT_ERR',
  FEE_ERR: 'FEE_ERR',
  // System
  APP_ERR: 'APP_ERR',
  HTTP_REQ_ERR: 'HTTP_REQ_ERR',
  // Custom business codes (assessment-specific)
  SL02: 'SL02',
  AC01: 'AC01',
  AC03: 'AC03',
  AC04: 'AC04',
  AC05: 'AC05',
  NF01: 'NF01',
  NF02: 'NF02',
};

// Map error codes to HTTP status codes
const ERROR_HTTP_MAP = {
  AUTH_ERR: 401,
  NO_AUTH_ERR: 401,
  INVALID_AUTH_TOKEN: 401,
  INACTIVE_ACCT: 401,
  EXPIRED_TOKEN: 401,
  PERM_ERR: 403,
  INVALID_REQ: 400,
  INVALID_DATA: 400,
  VALIDATION_ERR: 400,
  NOT_FOUND: 404,
  DUPLR_CRD: 409,
  LIMIT_ERR: 429,
  FEE_ERR: 400,
  APP_ERR: 500,
  HTTP_REQ_ERR: 500,
  // Custom
  SL02: 400,
  AC01: 400,
  AC03: 403,
  AC04: 403,
  AC05: 400,
  NF01: 404,
  NF02: 404,
};

class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = ERROR_HTTP_MAP[code] || 500;
  }
}

function throwAppError(message, code) {
  throw new AppError(message, code);
}

module.exports = { throwAppError, ERROR_CODE, AppError };
