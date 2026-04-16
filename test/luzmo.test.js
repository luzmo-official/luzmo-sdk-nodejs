const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const Luzmo = require("../src/luzmo");

function createClient(options = {}) {
  return new Luzmo({
    api_key: "test-key",
    api_token: "test-token",
    ...options,
  });
}

function withApiServer(handler, run) {
  return new Promise((resolve, reject) => {
    const requests = [];
    const server = http.createServer(async (req, res) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      await new Promise((requestResolve) => req.on("end", requestResolve));

      const request = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks),
      };
      requests.push(request);

      const response = await handler(request, requests.length - 1);
      res.statusCode = response?.status ?? 200;
      for (const [headerName, headerValue] of Object.entries(response?.headers ?? {})) {
        res.setHeader(headerName, headerValue);
      }
      res.end(response?.body ?? Buffer.alloc(0));
    });

    server.listen(0, "127.0.0.1", async () => {
      const address = server.address();
      const client = createClient({
        host: "http://127.0.0.1",
        port: String(address.port),
      });

      try {
        await run({ client, requests });
        server.close((closeError) => (closeError ? reject(closeError) : resolve()));
      } catch (error) {
        server.close(() => reject(error));
      }
    });
  });
}

function createLiveClient() {
  return new Luzmo({
    api_key: process.env.LUZMO_API_KEY,
    api_token: process.env.LUZMO_API_TOKEN,
    host: process.env.LUZMO_API_HOST,
    port: process.env.LUZMO_API_PORT,
    api_version: process.env.LUZMO_API_VERSION,
  });
}

test("constructor validates required options", () => {
  assert.throws(() => new Luzmo(), /valid API key and token/);
  assert.throws(() => new Luzmo({ api_key: 123, api_token: "token" }), /valid API key/);
  assert.throws(() => new Luzmo({ api_key: "key", api_token: 123 }), /valid API token/);
});

test("constructor defaults host, port and version", () => {
  const client = createClient();

  assert.equal(client.host, "https://api.luzmo.com");
  assert.equal(client.port, "443");
  assert.equal(client.api_version, "0.1.0");
});

test("create(data) sends documented create payload", async () => {
  const properties = {
    type: "create",
    data: [["Burrito", 3]],
    options: { update_metadata: true },
  };
  await withApiServer(
    async () => ({
      headers: { "content-type": "application/json" },
      body: Buffer.from(JSON.stringify({ code: 200 })),
    }),
    async ({ client, requests }) => {
      await client.create("data", properties);

      assert.equal(requests.length, 1);
      assert.equal(requests[0].method, "POST");
      assert.equal(requests[0].url, "/0.1.0/data");

      const body = JSON.parse(requests[0].body.toString());
      assert.deepEqual(body.properties, properties);
      assert.equal(body.action, "create");
      assert.equal(body.key, "test-key");
      assert.equal(body.token, "test-token");
      assert.equal(body.version, "0.1.0");
    },
  );
});

test("update(data) sends dataset id and properties", async () => {
  await withApiServer(
    async () => ({ body: Buffer.from("ok") }),
    async ({ client, requests }) => {
      await client.update("data", "dataset-id", {});
      const body = JSON.parse(requests[0].body.toString());

      assert.equal(body.action, "update");
      assert.equal(body.id, "dataset-id");
      assert.deepEqual(body.properties, {});
      assert.equal(requests[0].method, "PATCH");
    },
  );
});

test("query(filter) maps to data get with find wrapper", async () => {
  const filter = {
    queries: [{ dimensions: [{ dataset_id: "d", column_id: "c" }], measures: [] }],
  };
  await withApiServer(
    async () => ({ body: Buffer.from("rows") }),
    async ({ client, requests }) => {
      await client.query(filter);

      const body = JSON.parse(requests[0].body.toString());
      assert.equal(body.action, "get");
      assert.deepEqual(body.find, filter);
      assert.equal(requests[0].method, "SEARCH");
      assert.equal(requests[0].url, "/0.1.0/data");
    },
  );
});

test("close() is a safe no-op", () => {
  const client = createClient();

  assert.doesNotThrow(() => client.close());
  assert.equal(client.close(), undefined);
});

test("get(resource, filter) sends find payload", async () => {
  const filter = { where: { id: "abc" }, limit: 1 };
  await withApiServer(
    async () => ({ body: Buffer.from("rows") }),
    async ({ client, requests }) => {
      await client.get("dashboard", filter);
      const body = JSON.parse(requests[0].body.toString());

      assert.equal(body.action, "get");
      assert.deepEqual(body.find, filter);
      assert.equal(requests[0].method, "SEARCH");
    },
  );
});

test("delete(resource, id, properties) sends delete payload", async () => {
  await withApiServer(
    async () => ({ body: Buffer.from("ok") }),
    async ({ client, requests }) => {
      await client.delete("dashboard", "dashboard-id", { permanently: true });
      const body = JSON.parse(requests[0].body.toString());

      assert.equal(body.action, "delete");
      assert.equal(body.id, "dashboard-id");
      assert.deepEqual(body.properties, { permanently: true });
      assert.equal(requests[0].method, "DELETE");
    },
  );
});

test("associate(resource, id, association) sends resource association payload", async () => {
  const association = { role: "dataset", id: "dataset-id" };
  await withApiServer(
    async () => ({ body: Buffer.from("ok") }),
    async ({ client, requests }) => {
      await client.associate("integration", "integration-id", association, { flagUse: true });
      const body = JSON.parse(requests[0].body.toString());

      assert.equal(body.action, "associate");
      assert.equal(body.id, "integration-id");
      assert.deepEqual(body.resource, association);
      assert.deepEqual(body.properties, { flagUse: true });
      assert.equal(requests[0].method, "LINK");
    },
  );
});

test("dissociate(resource, id, association) sends dissociate payload", async () => {
  const association = { role: "dataset", id: "dataset-id" };
  await withApiServer(
    async () => ({ body: Buffer.from("ok") }),
    async ({ client, requests }) => {
      await client.dissociate("integration", "integration-id", association);
      const body = JSON.parse(requests[0].body.toString());

      assert.equal(body.action, "dissociate");
      assert.equal(body.id, "integration-id");
      assert.deepEqual(body.resource, association);
      assert.equal(requests[0].method, "UNLINK");
    },
  );
});

test("validate(resource, properties) sends validate payload", async () => {
  const properties = { email: "user@acme.com" };
  await withApiServer(
    async () => ({ body: Buffer.from("ok") }),
    async ({ client, requests }) => {
      await client.validate("user", properties);
      const body = JSON.parse(requests[0].body.toString());

      assert.equal(body.action, "validate");
      assert.deepEqual(body.resource, properties);
      assert.deepEqual(body.properties, properties);
      assert.equal(requests[0].method, "POST");
    },
  );
});

test("create with associations sends associations in create payload", async () => {
  const associations = [
    { role: "group", id: "group-1" },
    { role: "group", id: "group-2" },
  ];
  await withApiServer(
    async () => ({
      headers: { "content-type": "application/json" },
      body: Buffer.from(JSON.stringify({ id: "new-user-id" })),
    }),
    async ({ client, requests }) => {
      const created = await client.create("user", { name: "Ada" }, associations);

      assert.equal(created.id, "new-user-id");
      assert.equal(requests.length, 1);
      const body = JSON.parse(requests[0].body.toString());
      assert.equal(body.action, "create");
      assert.deepEqual(body.properties, { name: "Ada" });
      assert.deepEqual(body.associations, associations);
    },
  );
});

test("create without associations only sends create request", async () => {
  await withApiServer(
    async () => ({
      headers: { "content-type": "application/json" },
      body: Buffer.from(JSON.stringify({ id: "new-id" })),
    }),
    async ({ client, requests }) => {
      const created = await client.create("user", { name: "Ada" });
      assert.equal(created.id, "new-id");
      assert.equal(requests.length, 1);
    },
  );
});

test("returns parsed JSON body for JSON content-type", async () => {
  await withApiServer(
    async () => ({
      headers: { "content-type": "application/json; charset=utf-8" },
      body: Buffer.from(JSON.stringify({ ok: true, rows: [] })),
    }),
    async ({ client }) => {
      const result = await client.get("dashboard", {});
      assert.deepEqual(result, { ok: true, rows: [] });
    },
  );
});

test("returns raw buffer when JSON parsing fails", async () => {
  const raw = Buffer.from("{not-json");
  await withApiServer(
    async () => ({
      headers: { "content-type": "application/json" },
      body: raw,
    }),
    async ({ client }) => {
      const result = await client.get("dashboard", {});
      assert.deepEqual(result, raw);
    },
  );
});

test("returns raw payload for non-JSON content-type", async () => {
  const raw = Buffer.from("csv,data");
  await withApiServer(
    async () => ({
      headers: { "content-type": "text/csv" },
      body: raw,
    }),
    async ({ client }) => {
      const result = await client.get("dashboard", {});
      assert.deepEqual(result, raw);
    },
  );
});

test("throws parsed JSON API error body", async () => {
  await withApiServer(
    async () => ({
      status: 400,
      headers: { "content-type": "application/json" },
      body: Buffer.from(JSON.stringify({ type: { code: 400 }, message: "Bad Request" })),
    }),
    async ({ client }) => {
      await assert.rejects(client.get("data", {}), {
        type: { code: 400 },
        message: "Bad Request",
      });
    },
  );
});

test("throws raw error response data when not JSON", async () => {
  const raw = Buffer.from("Something failed");
  await withApiServer(
    async () => ({
      status: 400,
      headers: { "content-type": "text/plain" },
      body: raw,
    }),
    async ({ client }) => {
      await assert.rejects(async () => {
        await client.get("data", {});
      }, (error) => Buffer.isBuffer(error) && error.equals(raw));
    },
  );
});

test("throws cleaned transport error without request/config internals", async () => {
  const client = createClient({
    host: "http://127.0.0.1",
    port: "1",
  });

  await assert.rejects(async () => {
    await client.get("data", {});
  }, (error) => {
    assert.equal(typeof error.message, "string");
    assert.ok(error.message.length > 0);
    assert.equal(Object.hasOwn(error, "request"), false);
    assert.equal(Object.hasOwn(error, "config"), false);
    return true;
  });
});

test("static helper checks use expected semantics", () => {
  assert.equal(Luzmo._isInt(5), true);
  assert.equal(Luzmo._isInt(5.1), false);
  assert.equal(Luzmo._isNumeric("5"), true);
  assert.equal(Luzmo._isEmpty(undefined), true);
  assert.equal(Luzmo._isEmpty(null), true);
  assert.equal(Luzmo._isEmpty(""), false);
  assert.equal(Luzmo._isObject({ a: 1 }), true);
  assert.equal(Luzmo._isObject([]), false);
  assert.equal(Luzmo._isArray([]), true);
  assert.equal(Luzmo._isFunction(() => {}), true);
  assert.equal(Luzmo._isString("abc"), true);
  assert.equal(Luzmo._isBoolean(false), true);
  assert.equal(Luzmo._compress("payload"), "payload");
  assert.equal(Luzmo._decompress("payload"), "payload");
});

function assertListResponseContract(response) {
  // Guard "userspace" output shape across HTTP-client changes.
  assert.equal(Buffer.isBuffer(response), false);
  assert.equal(typeof response, "object");
  assert.equal(Array.isArray(response), false);
  assert.ok(response);
  assert.equal(typeof response.count, "number");
  assert.equal(Array.isArray(response.rows), true);
  assert.ok(response.count >= 0);
}

function assertObjectResponseContract(response) {
  assert.equal(Buffer.isBuffer(response), false);
  assert.equal(typeof response, "object");
  assert.equal(Array.isArray(response), false);
  assert.ok(response);
}

function assertMutationResponseContract(response) {
  // Some mutation endpoints may return non-JSON payloads, which the SDK
  // intentionally exposes as Buffer to preserve userspace behavior.
  if (Buffer.isBuffer(response)) {
    return;
  }

  assertObjectResponseContract(response);
}

function getTransportErrorCode(error) {
  if (typeof error?.code === "string") {
    return error.code;
  }
  if (typeof error?.cause?.code === "string") {
    return error.cause.code;
  }
  return undefined;
}

function assertTransportErrorContract(error, expectedCodes = []) {
  assert.equal(Buffer.isBuffer(error), false);
  assert.equal(typeof error?.message, "string");
  assert.ok(error.message.length > 0);

  const message = error.message.toLowerCase();
  assert.ok(
    message.includes("fetch")
      || message.includes("connect")
      || message.includes("network")
      || message.includes("failed")
      || message.includes("refused")
      || message.includes("timed out")
      || message.includes("timeout")
      || message.includes("not found"),
  );

  const transportCode = getTransportErrorCode(error);
  if (transportCode) {
    const acceptableTransportCodes = expectedCodes.length > 0
      ? expectedCodes
      : ["ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"];

    assert.ok(
      acceptableTransportCodes.includes(transportCode),
      `Unexpected transport code ${transportCode}`,
    );
  }

  return true;
}

function getApiErrorCode(error) {
  if (error && typeof error === "object" && error.type && typeof error.type === "object" && "code" in error.type) {
    return Number(error.type.code);
  }
  if (error && typeof error === "object" && "code" in error) {
    return Number(error.code);
  }
  return undefined;
}

function assertApiErrorContract(error, acceptedCodes = [400, 404]) {
  if (Buffer.isBuffer(error)) {
    assert.ok(error.length > 0);
    const payload = error.toString().trim();
    assert.ok(payload.length > 0);
    return true;
  }

  assert.equal(typeof error, "object");
  assert.ok(error);

  const apiCode = getApiErrorCode(error);
  assert.notEqual(apiCode, undefined, "Expected API error code in error.type.code or error.code");
  assert.ok(acceptedCodes.includes(apiCode), `Unexpected API error code ${apiCode}`);

  if ("message" in error) {
    assert.equal(typeof error.message, "string");
    assert.ok(error.message.trim().length > 0);
  } else {
    assert.ok(Object.keys(error).length > 0);
  }

  return true;
}

function assertStrictApiErrorContract(error, { apiCodes, messagePattern }) {
  assert.equal(Buffer.isBuffer(error), false, "Expected structured API error object");
  assertApiErrorContract(error, apiCodes);

  if (messagePattern) {
    assert.equal(typeof error.message, "string");
    assert.match(error.message.toLowerCase(), messagePattern);
  }

  return true;
}

function assertStrictBufferErrorContract(error, messagePattern) {
  assert.equal(Buffer.isBuffer(error), true, "Expected raw buffer error response");
  const payload = error.toString().trim().toLowerCase();
  assert.ok(payload.length > 0);
  if (messagePattern) {
    assert.match(payload, messagePattern);
  }
  return true;
}

function assertExactTransportErrorContract(error, { code, message, causeMessage }) {
  assert.equal(Buffer.isBuffer(error), false, "Expected transport error object");
  if (typeof code === "string") {
    assert.equal(getTransportErrorCode(error), code);
  } else {
    assert.equal(getTransportErrorCode(error), undefined);
  }
  assert.equal(error.message, message);
  if (typeof causeMessage === "string") {
    assert.equal(error?.cause?.message, causeMessage);
  }
  return true;
}

function assertExactBufferErrorContract(error, message) {
  assert.equal(Buffer.isBuffer(error), true, "Expected raw buffer error response");
  const payload = error.toString().trim();
  assert.equal(payload, message);
  return true;
}

if (!process.env.LUZMO_API_KEY || !process.env.LUZMO_API_TOKEN) {
  test("live API contract: get users", { skip: true }, () => {});
  test("live API contract: create and delete data dataset", { skip: true }, () => {});
  test("live API contract: associate and dissociate dataset with collection", { skip: true }, () => {});
  test("live API contract: create column with immediate dataset association", { skip: true }, () => {});
  test("live API error contract: wrong host", { skip: true }, () => {});
  test("live API error contract: wrong API version", { skip: true }, () => {});
  test("live API error contract: non-existing service", { skip: true }, () => {});
  test("live API error contract: invalid payload", { skip: true }, () => {});
} else {
  test("live API contract: get users", async () => {
    const client = createLiveClient();
    const response = await client.get("user", { limit: 1 });
    assertListResponseContract(response);

    if (response.rows.length > 0) {
      const firstRow = response.rows[0];
      assert.equal(typeof firstRow, "object");
      assert.ok(firstRow);
      assert.equal(typeof firstRow.id, "string");
      assert.ok(firstRow.id.length > 0);
    }
  });

  test("live API contract: create and delete data dataset", async () => {
      const client = createLiveClient();
      const nonce = `sdk-contract-${Date.now()}`;
      const createResponse = await client.create("data", {
        type: "create",
        data: [
          ["alpha", 1],
          ["beta", 2],
        ],
        options: {
          update_metadata: true,
          header: ["label", "value"],
          name: { en: nonce },
        },
      });

      assertListResponseContract(createResponse);
      assert.ok(createResponse.rows.length > 0);
      const createdDataset = createResponse.rows[0];
      assert.equal(typeof createdDataset.id, "string");
      assert.ok(createdDataset.id.length > 0);
      assert.equal(createdDataset.type, "dataset");
      assert.equal(typeof createdDataset.name, "object");
      assert.equal(createdDataset.name.en, nonce);

      try {
        const fetchedDataset = await client.get("securable", { where: { id: createdDataset.id }, limit: 1 });
        assertListResponseContract(fetchedDataset);
        assert.ok(fetchedDataset.rows.length >= 1);
      } finally {
        const deleteResponse = await client.delete("securable", createdDataset.id);
        assertMutationResponseContract(deleteResponse);
      }
    },
  );

  test("live API contract: associate and dissociate dataset with collection", async () => {
    const client = createLiveClient();
    const nonce = `sdk-assoc-collection-${Date.now()}`;
    let datasetId;

    try {
      const createDatasetResponse = await client.create("data", {
        type: "create",
        data: [["row", 1]],
        options: {
          update_metadata: true,
          header: ["label", "value"],
          name: { en: nonce },
        },
      });
      assertListResponseContract(createDatasetResponse);
      assert.ok(createDatasetResponse.rows.length > 0);
      datasetId = createDatasetResponse.rows[0].id;
      assert.equal(typeof datasetId, "string");
      assert.ok(datasetId.length > 0);

      let collectionId = process.env.LUZMO_COLLECTION_ID;
      if (!collectionId) {
        const collectionsResponse = await client.get("collection", { limit: 1 });
        assertListResponseContract(collectionsResponse);
        assert.ok(
          collectionsResponse.rows.length > 0,
          "No collections found. Provide LUZMO_COLLECTION_ID or create a collection first.",
        );
        collectionId = collectionsResponse.rows[0].id;
      }
      assert.equal(typeof collectionId, "string");
      assert.ok(collectionId.length > 0);

      const association = { role: "Collections", id: collectionId };
      const associated = await client.associate("securable", datasetId, association);
      assertMutationResponseContract(associated);

      const dissociated = await client.dissociate("securable", datasetId, association);
      assertMutationResponseContract(dissociated);
    } finally {
      if (datasetId) {
        const deletedDataset = await client.delete("securable", datasetId);
        assertMutationResponseContract(deletedDataset);
      }
    }
  });

  test("live API contract: create column with immediate dataset association", async () => {
    const client = createLiveClient();
    const nonce = `sdk-column-assoc-${Date.now()}`;
    let datasetId;

    try {
      const createDatasetResponse = await client.create("data", {
        type: "create",
        data: [["alpha", 1]],
        options: {
          update_metadata: true,
          header: ["label", "value"],
          name: { en: nonce },
        },
      });

      assertListResponseContract(createDatasetResponse);
      assert.ok(createDatasetResponse.rows.length > 0);
      datasetId = createDatasetResponse.rows[0].id;
      assert.equal(typeof datasetId, "string");
      assert.ok(datasetId.length > 0);

      const createColumnResponse = await client.create(
        "column",
        {
          type: "hierarchy",
          format: "",
          informat: "hierarchy",
          order: 0,
          source_order: 0,
          name: { en: `${nonce}-column` },
        },
        [{ role: "Securable", id: datasetId }],
      );

      assertObjectResponseContract(createColumnResponse);
      assert.equal(typeof createColumnResponse.id, "string");
      assert.ok(createColumnResponse.id.length > 0);
    } finally {
      if (datasetId) {
        const deletedDataset = await client.delete("securable", datasetId);
        assertMutationResponseContract(deletedDataset);
      }
    }
  });

  test("live API error contract: wrong host", async () => {
    const client = new Luzmo({
      api_key: process.env.LUZMO_API_KEY,
      api_token: process.env.LUZMO_API_TOKEN,
      host: "http://127.0.0.1",
      port: "1",
      api_version: process.env.LUZMO_API_VERSION,
    });

    await assert.rejects(async () => {
      await client.get("user", { limit: 1 });
    }, (error) => assertExactTransportErrorContract(error, {
      code: "ECONNREFUSED",
      message: "connect ECONNREFUSED 127.0.0.1:1",
      causeMessage: "connect ECONNREFUSED 127.0.0.1:1",
    }));
  });

  test("live API error contract: wrong API version", async () => {
    const client = new Luzmo({
      api_key: process.env.LUZMO_API_KEY,
      api_token: process.env.LUZMO_API_TOKEN,
      host: process.env.LUZMO_API_HOST,
      port: process.env.LUZMO_API_PORT,
      api_version: "999.999.999",
    });

    await assert.rejects(async () => {
      await client.get("user", { limit: 1 });
    }, (error) => assertExactBufferErrorContract(error, "Oops, this route does not exist (yet)!"));
  });

  test("live API error contract: non-existing service", async () => {
    const client = createLiveClient();

    await assert.rejects(async () => {
      await client.get("service-that-does-not-exist", { limit: 1 });
    }, (error) => assertExactBufferErrorContract(error, "Oops, this route does not exist (yet)!"));
  });

  test("live API error contract: invalid payload", async () => {
    const client = createLiveClient();
    const expectedMessage = "The data field must provide a valid list of rows (nested array) to add data to a dataset.\n"
      + "There has to be at least one row. Note that sending an empty data matrix does not make sense since\n"
      + "metadata updates which do not have corresponding data are ignored. In other words columns provided in the headers\n"
      + "which do not have a single data element are not added";

    await assert.rejects(async () => {
      await client.create("data", {
        type: "create",
        data: "this should be a 2D array",
        options: {
          update_metadata: true,
          header: "this should be an array",
        },
      });
    }, (error) => {
      assert.equal(Buffer.isBuffer(error), false, "Expected structured API error object");
      assert.equal(typeof error, "object");
      assert.ok(error);
      assert.equal(getApiErrorCode(error), 400);
      assert.equal(error?.type?.description, "Bad Request");
      assert.equal(error.message, expectedMessage);
      return true;
    });
  });
}
