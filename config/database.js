'use strict';

const mongoose = require('mongoose');
const { appLogger } = require('../core/logger');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  mongoose.connection.on('connected', () => appLogger.info({ msg: 'MongoDB connected' }, 'db'));
  mongoose.connection.on('error', (err) => appLogger.errorX(err, 'db'));
  mongoose.connection.on('disconnected', () => appLogger.warn({ msg: 'MongoDB disconnected' }, 'db'));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
}

module.exports = { connectDB };
