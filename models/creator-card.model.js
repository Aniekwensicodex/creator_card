'use strict';

const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
}, { _id: false });

const rateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
}, { _id: false });

const serviceRatesSchema = new mongoose.Schema({
  currency: { type: String, enum: ['NGN', 'USD', 'GBP', 'GHS'], required: true },
  rates: { type: [rateSchema], required: true },
}, { _id: false });

const creatorCardSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  slug: { type: String, required: true, unique: true },
  creator_reference: { type: String, required: true },
  links: { type: [linkSchema], default: [] },
  service_rates: { type: serviceRatesSchema, default: null },
  status: { type: String, enum: ['draft', 'published'], required: true },
  access_type: { type: String, enum: ['public', 'private'], default: 'public' },
  access_code: { type: String, default: null },
  created: { type: Number, required: true },
  updated: { type: Number, required: true },
  deleted: { type: Number, default: null },
}, {
  // Disable auto _id (we manage it ourselves as ULID)
  _id: false,
  // Don't add __v
  versionKey: false,
});

const CreatorCard = mongoose.model('CreatorCard', creatorCardSchema);

module.exports = { CreatorCard };
