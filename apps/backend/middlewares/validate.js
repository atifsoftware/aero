const Validator = require('../core/Validator');

/**
 * Express Request Validation Middleware
 * Declarative request validation supporting synchronous and asynchronous rules
 * (e.g. unique:table,column, exists:table,column).
 * 
 * Usage:
 *   router.post('/expenses', validate({
 *     amount: 'required|numeric|min:1',
 *     category_id: 'required|integer',
 *     account_id: 'required|integer'
 *   }), controllerAction);
 * 
 * @param {object|Function} rules - Rules object or callback returning rules
 * @param {object} [customMessages={}] - Optional custom error messages
 * @param {object} [customLabels={}] - Optional custom field labels
 */
function validate(rules, customMessages = {}, customLabels = {}) {
  return async (req, res, next) => {
    try {
      const activeRules = typeof rules === 'function' ? rules(req) : rules;
      const dataToValidate = req.method === 'GET' ? { ...req.query, ...req.params } : { ...req.body, ...req.params };

      const validator = await Validator.makeAsync(dataToValidate, activeRules, customMessages, customLabels);

      if (validator.fails()) {
        const errors = validator.errors();
        const firstError = validator.firstError ? validator.firstError() : Object.values(errors)[0]?.[0];

        // Check if API request or JSON client
        const isApi = req.originalUrl?.startsWith('/api') || 
                      req.xhr || 
                      req.get('accept')?.includes('application/json') ||
                      req.is('application/json');

        if (isApi) {
          return res.status(422).json({
            status: 'error',
            message: firstError || 'Validation failed',
            errors: errors
          });
        }

        // Web session fallback: save flash errors & old input and redirect back
        if (req.session) {
          req.session.errors = errors;
          req.session.old = req.body;
          if (req.flash) {
            req.flash('error', firstError || 'Validation failed');
          }
        }

        const backUrl = req.get('Referrer') || req.get('Referer') || '/';
        return res.redirect(backUrl);
      }

      // Attach validated data to request
      req.validated = dataToValidate;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = validate;
