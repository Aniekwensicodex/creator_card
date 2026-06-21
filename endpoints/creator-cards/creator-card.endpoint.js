'use strict';

const express = require('express');
const router = express.Router();

const { createCard, getCard, deleteCard } = require('../../services/creator-cards/creator-card.service');
const { validateCreateBody, validateDeleteBody } = require('../../services/creator-cards/creator-card.validation');
const { sendSuccess, sendError } = require('../../core/response');
const { AppError } = require('../../core/errors');
const { CREATOR_CARD_MESSAGES: MSG } = require('../../messages/creator-cards.messages');
const { appLogger } = require('../../core/logger');

/**
 * POST /creator-cards
 * Create a new Creator Card
 */
router.post('/', async (req, res) => {
  try {
    validateCreateBody(req.body);
    const card = await createCard(req.body);
    return sendSuccess(res, card, MSG.CREATED);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.httpStatus);
    }
    appLogger.errorX(err, 'POST /creator-cards');
    return sendError(res, 'An unexpected error occurred', 'APP_ERR', 500);
  }
});

/**
 * GET /creator-cards/:slug
 * Retrieve a Creator Card by slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { access_code } = req.query;
    const card = await getCard(slug, access_code);
    return sendSuccess(res, card, MSG.RETRIEVED);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.httpStatus);
    }
    appLogger.errorX(err, 'GET /creator-cards/:slug');
    return sendError(res, 'An unexpected error occurred', 'APPERR', 500);
  }
});

/**
 * DELETE /creator-cards/:slug
 * Delete a Creator Card by slug
 */
router.delete('/:slug', async (req, res) => {
  try {
    validateDeleteBody(req.body);
    const { slug } = req.params;
    const card = await deleteCard(slug, req.body);
    return sendSuccess(res, card, MSG.DELETED);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.code, err.httpStatus);
    }
    appLogger.errorX(err, 'DELETE /creator-cards/:slug');
    return sendError(res, 'An unexpected error occurred', 'APPERR', 500);
  }
});

module.exports = router;
