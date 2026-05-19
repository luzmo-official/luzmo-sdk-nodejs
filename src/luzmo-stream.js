"use strict";

const { TextDecoder } = require("util");

class LuzmoStream {
  constructor(options) {
    this.headers = options.headers;
    this.format = options.format;
    this._body = options.body;
    this._controller = options.controller;
    this._consumed = false;
  }

  cancel() {
    if (typeof this._controller?.abort === "function") {
      this._controller.abort();
    }
    if (typeof this._body?.cancel === "function") {
      this._body.cancel().catch(() => {});
    }
  }

  [Symbol.asyncIterator]() {
    if (this._consumed) {
      throw new Error("This stream has already been consumed.");
    }
    this._consumed = true;
    return this._iterateText();
  }

  async *_iterateText() {
    if (!this._body) {
      return;
    }

    const decoder = new TextDecoder();

    if (typeof this._body.getReader === "function") {
      const reader = this._body.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (!value) {
            continue;
          }
          yield decoder.decode(value, { stream: true });
        }
        const trailingChunk = decoder.decode();
        if (trailingChunk.length > 0) {
          yield trailingChunk;
        }
      } finally {
        reader.releaseLock?.();
      }

      return;
    }

    for await (const chunk of this._body) {
      if (!chunk) {
        continue;
      }
      if (typeof chunk === "string") {
        yield chunk;
        continue;
      }
      yield decoder.decode(chunk, { stream: true });
    }

    const trailingChunk = decoder.decode();
    if (trailingChunk.length > 0) {
      yield trailingChunk;
    }
  }
}

module.exports = LuzmoStream;
