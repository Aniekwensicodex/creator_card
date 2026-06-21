'use strict';

const { CreatorCard } = require('../../models/creator-card.model');

/**
 * Serialize a MongoDB document to API response shape.
 * Maps _id → id and excludes access_code for retrieval responses.
 */
function serialize(doc, { includeAccessCode = false } = {}) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const result = {
    id: obj._id,
    title: obj.title,
    description: obj.description ?? null,
    slug: obj.slug,
    creator_reference: obj.creator_reference,
    links: obj.links || [],
    service_rates: obj.service_rates ?? null,
    status: obj.status,
    access_type: obj.access_type,
    created: obj.created,
    updated: obj.updated,
    deleted: obj.deleted ?? null,
  };

  if (includeAccessCode) {
    result.access_code = obj.access_code ?? null;
  }

  return result;
}

async function create(data) {
  const card = new CreatorCard(data);
  await card.save();
  return card;
}

async function findBySlug(slug) {
  return CreatorCard.findOne({ slug, deleted: null });
}

async function slugExists(slug) {
  const count = await CreatorCard.countDocuments({ slug });
  return count > 0;
}

async function softDelete(slug) {
  const now = Date.now();
  const card = await CreatorCard.findOneAndUpdate(
    { slug, deleted: null },
    { $set: { deleted: now, updated: now } },
    { new: true }
  );
  return card;
}

module.exports = { create, findBySlug, slugExists, softDelete, serialize };
