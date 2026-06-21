'use strict';

const CREATOR_CARD_MESSAGES = {
  CREATED: 'Creator Card Created Successfully.',
  RETRIEVED: 'Creator Card Retrieved Successfully.',
  DELETED: 'Creator Card Deleted Successfully.',

  // Business rule errors
  SLUG_TAKEN: 'Slug is already taken',
  ACCESS_CODE_REQUIRED: 'access_code is required when access_type is private',
  ACCESS_CODE_FORBIDDEN: 'access_code can only be set on private cards',
  CARD_NOT_FOUND: 'Creator card not found',
  CARD_IS_DRAFT: 'Card exists but is a draft',
  PRIVATE_NO_CODE: 'This card is private. An access code is required',
  INVALID_ACCESS_CODE: 'Invalid access code',
};

module.exports = { CREATOR_CARD_MESSAGES };
