'use strict';

const express = require('express');
const { jsonParseErrorHandler, globalErrorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const creatorCardEndpoint = require('./endpoints/creator-cards/creator-card.endpoint');

const app = express();

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/creator-cards', creatorCardEndpoint);

// ── Error middleware (order matters) ──────────────────────────────────────────
app.use(jsonParseErrorHandler);
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = { app };
