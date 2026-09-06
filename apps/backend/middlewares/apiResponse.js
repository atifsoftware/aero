/**
 * Unified API Response Decorator Middleware
 * Standardizes API responses across all controllers.
 * 
 * Provides:
 *   - res.success(data, message, statusCode, meta)
 *   - res.error(message, statusCode, errors, errorCode)
 *   - res.paginate(paginatedObj, message)
 */
function apiResponse(req, res, next) {
  req._startTime = Date.now();

  /**
   * Send a standardized success JSON response
   */
  res.success = function (data = null, message = 'Operation successful', statusCode = 200, meta = {}) {
    const duration = Date.now() - req._startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);

    const response = {
      status: 'success',
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        execution_time_ms: duration,
        ...meta
      }
    };

    return res.status(statusCode).json(response);
  };

  /**
   * Send a standardized error JSON response
   */
  res.error = function (message = 'An error occurred', statusCode = 400, errors = null, errorCode = null) {
    const duration = Date.now() - req._startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);

    const response = {
      status: 'error',
      message,
      ...(errors ? { errors } : {}),
      ...(errorCode ? { error_code: errorCode } : {}),
      meta: {
        timestamp: new Date().toISOString(),
        execution_time_ms: duration
      }
    };

    return res.status(statusCode).json(response);
  };

  /**
   * Send a standardized paginated response
   */
  res.paginate = function (paginatedData, message = 'Records retrieved successfully') {
    const duration = Date.now() - req._startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);

    const data = paginatedData?.data !== undefined ? paginatedData.data : paginatedData;
    const pagination = paginatedData?.pagination || null;

    const response = {
      status: 'success',
      message,
      data,
      ...(pagination ? { pagination } : {}),
      meta: {
        timestamp: new Date().toISOString(),
        execution_time_ms: duration
      }
    };

    return res.status(200).json(response);
  };

  next();
}

module.exports = apiResponse;
