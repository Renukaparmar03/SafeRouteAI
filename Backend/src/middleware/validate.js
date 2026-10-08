/**
 * Validates and coerces request data with a zod schema.
 * Parsed values are stored on req.valid so controllers never read raw input.
 */
export const validate = (schemas) => (req, res, next) => {
  req.valid = req.valid || {};
  if (schemas.body) req.valid.body = schemas.body.parse(req.body ?? {});
  if (schemas.query) req.valid.query = schemas.query.parse(req.query ?? {});
  if (schemas.params) req.valid.params = schemas.params.parse(req.params ?? {});
  next();
};

/** Removes keys that could be used for MongoDB operator injection. */
const stripDangerousKeys = (value) => {
  if (Array.isArray(value)) return value.map(stripDangerousKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith('$') && !key.includes('.') && key !== '__proto__' && key !== 'constructor')
        .map(([key, v]) => [key, stripDangerousKeys(v)])
    );
  }
  return value;
};

export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') req.body = stripDangerousKeys(req.body);
  next();
};
