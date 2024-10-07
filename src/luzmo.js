/**
 * Luzmo API SDK
 * API : REST, language : Node.js
 *
 * Need some help? Contact us at support@luzmo.com
 */

const axios = require('axios');

"use strict";

const HOST = "https://api.luzmo.com",
      PORT = "443",
      API_VERSION = "0.1.0";

class Luzmo {
  /**
   * Create a new API client instance.
   *
   * options          Object, options to set.
   *   api_key        String, your personal API key (required)
   *   api_token      String, your secret API token (required)
   *   api_version    String, semantic versioned API version to use (default: 0.1.0)
   *   host           String, host of the API (default: https://api.luzmo.com)
   *   port           String, port of the API (default: 443)
   */

  constructor(options) {
    const t = this;
    if (Luzmo._isEmpty(options))
      throw new Error(
        "You must provide a valid API key and token. Contact the Luzmo-team if in doubt!"
      );
    if (Luzmo._isEmpty(options.api_key) || !Luzmo._isString(options.api_key))
      throw new Error(
        "You must provide a valid API key. Contact the Luzmo-team if in doubt!"
      );
    if (Luzmo._isEmpty(options.api_token) || !Luzmo._isString(options.api_token))
      throw new Error(
        "You must provide a valid API token. Contact the Luzmo-team if in doubt!"
      );

    t.host = Luzmo._isEmpty(options.host) ? HOST : options.host;
    t.port = Luzmo._isEmpty(options.port) ? PORT : options.port;
    t.api_version = Luzmo._isEmpty(options.api_version)
      ? API_VERSION
      : options.api_version;
    t.api_key = options.api_key;
    t.api_token = options.api_token;
  }

  /**
   * Create a new entity.
   *
   * resource         String, the type of resource to create. Eg. 'user'.
   * properties       Object, properties of the new resource.
   * associations     Array, associations to set on the newly created resource. Optional.
   *                  Each association should be of the format { role: ..., id: ... }
   *
   * Returns a promise resolving in case of completion, rejecting in case of error.
   */
  create(resource, properties, associations) {
    const t = this;
    return t
      ._emit(resource, {
        action: "create",
        properties: properties,
      })
      .then(function (instance) {
        // Set associations on the newly created resource
        if (Luzmo._isEmpty(associations) || associations.length === 0)
          return instance;
        const promises = associations.map(function (association) {
          return t.associate(resource, instance.id, association);
        });
        return Promise.all(promises).then(function () {
          return instance;
        });
      });
  };

  /**
   * Retrieve one or more entities.
   *
   * resource         String, the type of resource to retrieve. Eg. 'user'.
   * find             Object, filtering / limiting / paging options.
   *                  Reference: http://docs.sequelizejs.com/en/1.7.0/docs/models/#findall-search-for-multiple-elements-in-the-database
   *
   * Returns a promise resolving with the resources retrieved, rejecting in case of error.
   */
  get(resource, filter) {
    const t = this;
    const query = {
      action: "get",
      find: filter,
    };
    return t._emit(resource, query);
  };

  /**
   * Mark an entity as deleted.
   *
   * resource         String, the type of resource to delete. Eg. 'user'.
   * id               UUID, the unique identifier of the resource to delete.
   * properties       Object, additional properties needed to delete
   *                  (optional, see API reference for resources to use this with)
   *
   * Returns a promise resolving in case of completion, rejecting in case of error.
   */
  delete(resource, id, properties) {
    const t = this;
    return t._emit(resource, {
      action: "delete",
      id: id,
      properties: properties,
    });
  };

  /**
   * Update properties of an entity.
   *
   * resource         String, the type of resource to update. Eg. 'user'.
   * id               UUID, the unique identifier of the resource to update.
   * properties       Object, properties to modify.
   *
   * Returns a promise resolving with the updated resource, rejecting in case of error.
   */
  update(resource, id, properties) {
    const t = this;
    return t._emit(resource, {
      action: "update",
      id: id,
      properties: properties,
    });
  };

  /**
   * Associate two entities.
   *
   * resource         String, the type of the 1st resource to associate. Eg. 'user'.
   * id               UUID, the unique identifier of the 1st resource to associate.
   * association      Object, 2nd resource to associate.
   * - role           String, the role the 2nd resource will take.
   * - id             UUID, the unique identifier of the 2nd resource.
   * properties       Object with attributes to be updated (e.g. flagUse).
   *
   * Returns a promise resolving with the updated resource, rejecting in case of error.
   */
  associate(resource, id, association, properties) {
    const t = this;
    return t._emit(resource, {
      action: "associate",
      id: id,
      resource: association,
      properties: properties,
    });
  };

  /**
   * Dissociate two entities.
   *
   * resource         String, the type of the 1st resource to dissociate. Eg. 'user'.
   * id               UUID, the unique identifier of the 1st resource to dissociate.
   * association      Object, 2nd resource to dissociate.
   * - role           String, the role the 2nd resource has.
   * - id             UUID, the unique identifier of the 2nd resource.
   *
   * Returns a promise resolving with the updated resource, rejecting in case of error.
   */
  dissociate(resource, id, association) {
    const t = this;
    return t._emit(resource, {
      action: "dissociate",
      id: id,
      resource: association,
    });
  };

  /**
   * Validate data.
   *
   * resource         String, the type of the resource to validate an attribute of. Eg. 'user'.
   * properties       Object with attributes to validate.
   *
   * Returns a promise resolving with the boolean validation result, rejecting in case of error.
   */
  validate(resource, properties) {
    const t = this;
    return t._emit(resource, {
      action: "validate",
      resource: properties,
      properties: properties,
    });
  };

  /**
   * Do a data query.
   *
   * filter       Query, object consisting of dimensions & measures
   *
   * Returns a promise that either:
   * - In case of unsynchronized querying, resolves with the results of a query and rejects in case of error.
   *   on the server and rejects in case of error.
   */
  query(filter) {
    const t = this;
    return t._emit("data", {
      action: "get",
      find: filter,
    });
  };

  /**
   * Close the connection to the API.
   */
  close() {
    const t = this;
  };

  /* Helpers */

  /**
   * Set up connection -- no persistent connection needed
   */
  _connect() {
    const t = this;
  };

  /**
   * Buffer connections
   */
_onConnect() {
    const t = this;
  };

  /**
   * Push out message over socket
   */
  _emit(event, data) {
    const t = this;
    const HTTP_METHOD = {
      get: "SEARCH",
      create: "POST",
      update: "PATCH",
      delete: "DELETE",
      associate: "LINK",
      dissociate: "UNLINK",
      validate: "POST",
    };

    data.key = t.api_key;
    data.token = t.api_token;
    data.version = t.api_version;

    const requestSettings = {
      method: HTTP_METHOD[data.action],
      url: `${t.host}:${t.port}/${t.api_version}/${event}`,
      data: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
      responseType: "arraybuffer",
    };
    return axios(requestSettings)
      .then((response) => {
        const isJSON =
          !Luzmo._isEmpty(response.headers) &&
          !Luzmo._isEmpty(response.headers["content-type"]) &&
          response.headers["content-type"].includes("application/json");
        if (isJSON) {
          return JSON.parse(response.data.toString());
        }
        return response.data;
      })
      .catch((error) => {
        if (!Luzmo._isEmpty(error.response)) {
          const isJSON =
            !_isEmpty(error.response.headers) &&
            !_isEmpty(error.response.headers["content-type"]) &&
            error.response.headers["content-type"].includes("application/json");
          if (isJSON) {
            throw JSON.parse(error.response.data.toString());
          }
          throw error.response.data;
        }
        delete error.request;
        delete error.config;
        throw error;
      });
  }

  /**
   * Type checks
   */

  static _isInt(value) {
    return !isNaN(value) && parseInt(Number(value).toString(), 10) === value;
  };

  static _isNumeric(value) {
    return !isNaN(value) && isFinite(value);
  };

  static _isEmpty(value) {
    return value === null || typeof value === "undefined";
  };

  static _isObject(value) {
    return (
      !(value === null) && typeof value === "object" && !Array.isArray(value)
    );
  };

  static _isArray(value) {
    return Array.isArray(value);
  };

  static _isFunction(value) {
    return value && {}.toString.call(value) === "[object Function]";
  };

  static _isString(value) {
    return typeof value === "string" || value instanceof String;
  };

  static _isBoolean(value) {
    return value === true || value === false;
  };

  /**
 * Decompress a received payload.
 */
  static _decompress(payload) {
    return payload;
  };

  /**
 * Compress a payload before sending.
 */
  static _compress(payload) {
    return payload;
  };
}

module.exports = Luzmo;
