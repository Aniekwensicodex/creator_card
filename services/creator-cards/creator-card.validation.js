'use strict';

const { throwAppError, ERROR_CODE } = require('../../core/errors');

/**
 * Inline validation for POST /creator-cards
 * Mirrors what the template's VSL validator would produce.
 * Returns cleaned body or throws with HTTP 400.
 */
function validateCreateBody(body) {
  const errors = [];

  // title — required, string, 3-100 chars
  if (body.title === undefined || body.title === null) {
    errors.push("'title' is required");
  } else if (typeof body.title !== 'string') {
    errors.push("'title' must be a string");
  } else if (body.title.trim().length < 3 || body.title.trim().length > 100) {
    errors.push("'title' must be between 3 and 100 characters");
  }

  // description — optional, string, max 500
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.push("'description' must be a string");
    } else if (body.description.length > 500) {
      errors.push("'description' must be at most 500 characters");
    }
  }

  // slug — optional, but if provided: 5-50 chars, letters/numbers/hyphens/underscores
  if (body.slug !== undefined && body.slug !== null) {
    if (typeof body.slug !== 'string') {
      errors.push("'slug' must be a string");
    } else {
      if (body.slug.length < 5 || body.slug.length > 50) {
        errors.push("'slug' must be between 5 and 50 characters");
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(body.slug)) {
        errors.push("'slug' may only contain letters, numbers, hyphens, and underscores");
      }
    }
  }

  // creator_reference — required, exactly 20 chars
  if (body.creator_reference === undefined || body.creator_reference === null) {
    errors.push("'creator_reference' is required");
  } else if (typeof body.creator_reference !== 'string') {
    errors.push("'creator_reference' must be a string");
  } else if (body.creator_reference.length !== 20) {
    errors.push("'creator_reference' must be exactly 20 characters");
  }

  // links — optional array
  if (body.links !== undefined && body.links !== null) {
    if (!Array.isArray(body.links)) {
      errors.push("'links' must be an array");
    } else {
      body.links.forEach((link, i) => {
        if (!link.title || typeof link.title !== 'string' || link.title.length < 1 || link.title.length > 100) {
          errors.push(`'links[${i}].title' must be a string between 1 and 100 characters`);
        }
        if (!link.url || typeof link.url !== 'string') {
          errors.push(`'links[${i}].url' is required and must be a string`);
        } else if (link.url.length > 200) {
          errors.push(`'links[${i}].url' must be at most 200 characters`);
        } else if (!/^https?:\/\//i.test(link.url)) {
          errors.push(`'links[${i}].url' must start with http:// or https://`);
        }
      });
    }
  }

  // service_rates — optional object
  if (body.service_rates !== undefined && body.service_rates !== null) {
    if (typeof body.service_rates !== 'object' || Array.isArray(body.service_rates)) {
      errors.push("'service_rates' must be an object");
    } else {
      const validCurrencies = ['NGN', 'USD', 'GBP', 'GHS'];
      if (!body.service_rates.currency) {
        errors.push("'service_rates.currency' is required");
      } else if (!validCurrencies.includes(body.service_rates.currency)) {
        errors.push(`'service_rates.currency' must be one of: ${validCurrencies.join(', ')}`);
      }

      if (!body.service_rates.rates || !Array.isArray(body.service_rates.rates) || body.service_rates.rates.length === 0) {
        errors.push("'service_rates.rates' must be a non-empty array");
      } else {
        body.service_rates.rates.forEach((rate, i) => {
          if (!rate.name || typeof rate.name !== 'string' || rate.name.length < 3 || rate.name.length > 100) {
            errors.push(`'service_rates.rates[${i}].name' must be a string between 3 and 100 characters`);
          }
          if (rate.description !== undefined && rate.description !== null) {
            if (typeof rate.description !== 'string' || rate.description.length > 250) {
              errors.push(`'service_rates.rates[${i}].description' must be a string of at most 250 characters`);
            }
          }
          if (rate.amount === undefined || rate.amount === null) {
            errors.push(`'service_rates.rates[${i}].amount' is required`);
          } else if (typeof rate.amount !== 'number' || !Number.isInteger(rate.amount) || rate.amount < 1) {
            errors.push(`'service_rates.rates[${i}].amount' must be a positive integer`);
          }
        });
      }
    }
  }

  // status — required, enum
  if (body.status === undefined || body.status === null) {
    errors.push("'status' is required");
  } else if (!['draft', 'published'].includes(body.status)) {
    errors.push(`${body.status} is not a valid status`);
  }

  // access_type — optional enum
  if (body.access_type !== undefined && body.access_type !== null) {
    if (!['public', 'private'].includes(body.access_type)) {
      errors.push("'access_type' must be one of: public, private");
    }
  }

  if (errors.length > 0) {
    throwAppError(errors[0], ERROR_CODE.VALIDATION_ERR);
  }
}

/**
 * Validate DELETE body
 */
function validateDeleteBody(body) {
  const errors = [];

  if (!body || body.creator_reference === undefined || body.creator_reference === null) {
    errors.push("'creator_reference' is required");
  } else if (typeof body.creator_reference !== 'string') {
    errors.push("'creator_reference' must be a string");
  } else if (body.creator_reference.length !== 20) {
    errors.push("'creator_reference' must be exactly 20 characters");
  }

  if (errors.length > 0) {
    throwAppError(errors[0], ERROR_CODE.VALIDATION_ERR);
  }
}

module.exports = { validateCreateBody, validateDeleteBody };
