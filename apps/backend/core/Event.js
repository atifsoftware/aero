/**
 * Enterprise Event Dispatcher & Observer Bus for Aero MVC
 * Provides decoupled, event-driven architecture for E-commerce ERP workflows
 * (Stock adjustments, Ledger entries, Invoicing, Notifications, Audit logs).
 */

let _logger = null;
function getLogger() {
  if (!_logger) {
    try {
      _logger = require('./Logger');
    } catch {
      _logger = null;
    }
  }
  return _logger;
}

class EventDispatcher {
  constructor() {
    this._listeners = new Map(); // Map<eventName, Array<{ handler, priority, once }>>
    this._wildcardListeners = []; // Array<{ pattern: RegExp, handler, priority, once }>
  }

  /**
   * Register a listener for an event
   * Supports wildcard patterns like 'order.*' or '*'
   * 
   * @param {string} event Event name or pattern
   * @param {Function} handler Async or sync callback (payload, eventName) => {}
   * @param {Object} [options]
   * @param {number} [options.priority=0] Higher numbers run earlier
   * @param {boolean} [options.once=false] Run only once then remove
   */
  listen(event, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new TypeError(`Event listener for '${event}' must be a function.`);
    }

    const priority = options.priority || 0;
    const once = options.once === true;

    if (event.includes('*')) {
      const regexPattern = new RegExp('^' + event.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      this._wildcardListeners.push({ pattern: regexPattern, handler, priority, once, rawEvent: event });
      this._wildcardListeners.sort((a, b) => b.priority - a.priority);
    } else {
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      const list = this._listeners.get(event);
      list.push({ handler, priority, once });
      list.sort((a, b) => b.priority - a.priority);
    }

    return this;
  }

  /**
   * Register a one-time event listener
   */
  once(event, handler, options = {}) {
    return this.listen(event, handler, { ...options, once: true });
  }

  /**
   * Dispatch an event sequentially to all registered listeners
   * Returns array of listener return values
   * 
   * @param {string} event Event name
   * @param {*} [payload] Event data/arguments
   * @returns {Promise<Array>}
   */
  async dispatch(event, payload = null) {
    const matching = this._getMatchingListeners(event);
    const results = [];

    for (const item of matching) {
      try {
        const res = await item.handler(payload, event);
        results.push(res);
      } catch (err) {
        const logger = getLogger();
        const msg = `[EventDispatcher] Error in listener for '${event}': ${err.message}`;
        if (logger && typeof logger.error === 'function') {
          logger.error(msg, { error: err.stack, event, payload });
        } else {
          console.error(`\x1b[31m${msg}\x1b[0m\n`, err);
        }
        throw err;
      }
    }

    return results;
  }

  /**
   * Dispatch an event in the background (fire-and-forget)
   * Execution does not block current HTTP request and catches errors safely.
   */
  dispatchAsync(event, payload = null) {
    setImmediate(async () => {
      try {
        await this.dispatch(event, payload);
      } catch (err) {
        // Already logged in dispatch
      }
    });
  }

  /**
   * Dispatch event into the persistent background queue
   */
  async queue(event, payload = null, queueName = 'default') {
    try {
      const Queue = require('./Queue');
      return await Queue.push('AeroEventJob', { event, payload }, { queue: queueName });
    } catch (err) {
      const logger = getLogger();
      if (logger) logger.warning(`Failed to queue event '${event}': ${err.message}`);
      // Fallback to async execution
      this.dispatchAsync(event, payload);
    }
  }

  /**
   * Check if any listeners exist for an event
   */
  hasListeners(event) {
    return this._getMatchingListeners(event, false).length > 0;
  }

  /**
   * Remove listeners for a specific event
   */
  forget(event) {
    this._listeners.delete(event);
    this._wildcardListeners = this._wildcardListeners.filter(w => w.rawEvent !== event);
  }

  /**
   * Clear all registered listeners
   */
  forgetAll() {
    this._listeners.clear();
    this._wildcardListeners = [];
  }

  /**
   * Internal helper to collect matching listeners and purge one-time listeners
   */
  _getMatchingListeners(event, pruneOnce = true) {
    const list = [];

    // Exact matches
    if (this._listeners.has(event)) {
      const exactList = this._listeners.get(event);
      list.push(...exactList);
      if (pruneOnce) {
        this._listeners.set(event, exactList.filter(l => !l.once));
      }
    }

    // Wildcard matches
    if (this._wildcardListeners.length > 0) {
      const remainingWildcards = [];
      for (const w of this._wildcardListeners) {
        if (w.pattern.test(event)) {
          list.push(w);
          if (!w.once || !pruneOnce) {
            remainingWildcards.push(w);
          }
        } else {
          remainingWildcards.push(w);
        }
      }
      if (pruneOnce) {
        this._wildcardListeners = remainingWildcards;
      }
    }

    // Sort by priority
    list.sort((a, b) => b.priority - a.priority);
    return list;
  }
}

// Global Singleton instance
const Event = new EventDispatcher();

module.exports = Event;
