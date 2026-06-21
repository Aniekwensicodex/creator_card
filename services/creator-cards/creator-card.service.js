'use strict';

const { generateId } = require('../../core/id');
const { throwAppError, ERROR_CODE } = require('../../core/errors');
const repo = require('../../repository/creator-cards/creator-card.repository');
const { CREATOR_CARD_MESSAGES: MSG } = require('../../messages/creator-cards.messages');

/**
 * Generate a URL-safe slug from a title string.
 */
function slugifyTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

/**
 * Generate a random 6-character alphanumeric suffix.
 */
function randomSuffix() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Validate and apply business rules for access_type / access_code.
 */
function validateAccessRules(body) {
  const { access_type, access_code } = body;

  const effectiveAccessType = access_type || 'public';

  if (effectiveAccessType === 'private') {
    if (!access_code) {
      throwAppError(MSG.ACCESS_CODE_REQUIRED, ERROR_CODE.AC01);
    }
    // Validate exactly 6 alphanumeric
    if (!/^[a-zA-Z0-9]{6}$/.test(access_code)) {
      throwAppError('access_code must be exactly 6 alphanumeric characters', ERROR_CODE.VALIDATION_ERR);
    }
  }

  if (effectiveAccessType === 'public' && access_code !== undefined && access_code !== null) {
    throwAppError(MSG.ACCESS_CODE_FORBIDDEN, ERROR_CODE.AC05);
  }
}

/**
 * POST /creator-cards
 */
async function createCard(body) {
  // Business rule: access type / access_code
  validateAccessRules(body);

  const effectiveAccessType = body.access_type || 'public';
  let slug = body.slug;
  const clientProvidedSlug = !!slug;

  if (clientProvidedSlug) {
    // Client-provided slug: check uniqueness
    const taken = await repo.slugExists(slug);
    if (taken) {
      throwAppError(MSG.SLUG_TAKEN, ERROR_CODE.SL02);
    }
  } else {
    // Auto-generate from title
    let generated = slugifyTitle(body.title);

    const tooShort = generated.length < 5;
    const taken = generated.length >= 5 ? await repo.slugExists(generated) : false;

    if (tooShort || taken) {
      generated = `${generated}-${randomSuffix()}`;
    }

    slug = generated;
  }

  const now = Date.now();
  const id = generateId();

  const cardData = {
    _id: id,
    title: body.title,
    description: body.description ?? null,
    slug,
    creator_reference: body.creator_reference,
    links: body.links || [],
    service_rates: body.service_rates ?? null,
    status: body.status,
    access_type: effectiveAccessType,
    access_code: effectiveAccessType === 'private' ? body.access_code : null,
    created: now,
    updated: now,
    deleted: null,
  };

  const doc = await repo.create(cardData);
  return repo.serialize(doc, { includeAccessCode: true });
}

/**
 * GET /creator-cards/:slug
 */
async function getCard(slug, queryAccessCode) {
  const doc = await repo.findBySlug(slug);

  // Rule 1: not found at all
  if (!doc) {
    throwAppError(MSG.CARD_NOT_FOUND, ERROR_CODE.NF01);
  }

  // Rule 2: draft cards are not publicly retrievable
  if (doc.status === 'draft') {
    throwAppError(MSG.CARD_IS_DRAFT, ERROR_CODE.NF02);
  }

  // Rule 3 & 4: private access control
  if (doc.access_type === 'private') {
    if (!queryAccessCode) {
      throwAppError(MSG.PRIVATE_NO_CODE, ERROR_CODE.AC03);
    }
    if (queryAccessCode !== doc.access_code) {
      throwAppError(MSG.INVALID_ACCESS_CODE, ERROR_CODE.AC04);
    }
  }

  // access_code is NEVER returned in retrieval responses
  return repo.serialize(doc, { includeAccessCode: false });
}

/**
 * DELETE /creator-cards/:slug
 */
async function deleteCard(slug, body) {
  const existing = await repo.findBySlug(slug);

  if (!existing) {
    throwAppError(MSG.CARD_NOT_FOUND, ERROR_CODE.NF01);
  }

  // Verify creator_reference matches
  // if (existing.creator_reference !== body.creator_reference) {
  //   throwAppError('Creator reference does not match', ERROR_CODE.NOT_FOUND);
  // }

  const deleted = await repo.softDelete(slug);
  return repo.serialize(deleted, { includeAccessCode: true });
}

module.exports = { createCard, getCard, deleteCard };
