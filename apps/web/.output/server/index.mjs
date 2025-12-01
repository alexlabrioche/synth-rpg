globalThis.__nitro_main__ = import.meta.url;
import nodeHTTP from "node:http";
import { Readable } from "node:stream";
import nodeHTTPS from "node:https";
import nodeHTTP2 from "node:http2";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
function lazyService(loader) {
  let promise, mod;
  return {
    fetch(req) {
      if (mod) {
        return mod.fetch(req);
      }
      if (!promise) {
        promise = loader().then((_mod) => mod = _mod.default || _mod);
      }
      return promise.then((mod2) => mod2.fetch(req));
    }
  };
}
const services = {
  ["ssr"]: lazyService(() => import("./chunks/_/server.mjs"))
};
globalThis.__nitro_vite_envs__ = services;
const noColor = /* @__PURE__ */ (() => {
  const env = globalThis.process?.env ?? {};
  return env.NO_COLOR === "1" || env.TERM === "dumb";
})();
const _c = (c, r = 39) => (t) => noColor ? t : `\x1B[${c}m${t}\x1B[${r}m`;
const red = /* @__PURE__ */ _c(31);
const gray = /* @__PURE__ */ _c(90);
function lazyInherit(target, source, sourceKey) {
  for (const key2 of [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)]) {
    if (key2 === "constructor") continue;
    const targetDesc = Object.getOwnPropertyDescriptor(target, key2);
    const desc = Object.getOwnPropertyDescriptor(source, key2);
    let modified = false;
    if (desc.get) {
      modified = true;
      desc.get = targetDesc?.get || function() {
        return this[sourceKey][key2];
      };
    }
    if (desc.set) {
      modified = true;
      desc.set = targetDesc?.set || function(value) {
        this[sourceKey][key2] = value;
      };
    }
    if (!targetDesc?.value && typeof desc.value === "function") {
      modified = true;
      desc.value = function(...args) {
        return this[sourceKey][key2](...args);
      };
    }
    if (modified) Object.defineProperty(target, key2, desc);
  }
}
const FastURL = /* @__PURE__ */ (() => {
  const NativeURL = globalThis.URL;
  const FastURL$1 = class URL {
    #url;
    #href;
    #protocol;
    #host;
    #pathname;
    #search;
    #searchParams;
    #pos;
    constructor(url) {
      if (typeof url === "string") this.#href = url;
      else {
        this.#protocol = url.protocol;
        this.#host = url.host;
        this.#pathname = url.pathname;
        this.#search = url.search;
      }
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeURL;
    }
    get _url() {
      if (this.#url) return this.#url;
      this.#url = new NativeURL(this.href);
      this.#href = void 0;
      this.#protocol = void 0;
      this.#host = void 0;
      this.#pathname = void 0;
      this.#search = void 0;
      this.#searchParams = void 0;
      this.#pos = void 0;
      return this.#url;
    }
    get href() {
      if (this.#url) return this.#url.href;
      if (!this.#href) this.#href = `${this.#protocol || "http:"}//${this.#host || "localhost"}${this.#pathname || "/"}${this.#search || ""}`;
      return this.#href;
    }
    #getPos() {
      if (!this.#pos) {
        const url = this.href;
        const protoIndex = url.indexOf("://");
        const pathnameIndex = protoIndex === -1 ? -1 : url.indexOf("/", protoIndex + 4);
        this.#pos = [
          protoIndex,
          pathnameIndex,
          pathnameIndex === -1 ? -1 : url.indexOf("?", pathnameIndex)
        ];
      }
      return this.#pos;
    }
    get pathname() {
      if (this.#url) return this.#url.pathname;
      if (this.#pathname === void 0) {
        const [, pathnameIndex, queryIndex] = this.#getPos();
        if (pathnameIndex === -1) return this._url.pathname;
        this.#pathname = this.href.slice(pathnameIndex, queryIndex === -1 ? void 0 : queryIndex);
      }
      return this.#pathname;
    }
    get search() {
      if (this.#url) return this.#url.search;
      if (this.#search === void 0) {
        const [, pathnameIndex, queryIndex] = this.#getPos();
        if (pathnameIndex === -1) return this._url.search;
        const url = this.href;
        this.#search = queryIndex === -1 || queryIndex === url.length - 1 ? "" : url.slice(queryIndex);
      }
      return this.#search;
    }
    get searchParams() {
      if (this.#url) return this.#url.searchParams;
      if (!this.#searchParams) this.#searchParams = new URLSearchParams(this.search);
      return this.#searchParams;
    }
    get protocol() {
      if (this.#url) return this.#url.protocol;
      if (this.#protocol === void 0) {
        const [protocolIndex] = this.#getPos();
        if (protocolIndex === -1) return this._url.protocol;
        this.#protocol = this.href.slice(0, protocolIndex + 1);
      }
      return this.#protocol;
    }
    toString() {
      return this.href;
    }
    toJSON() {
      return this.href;
    }
  };
  lazyInherit(FastURL$1.prototype, NativeURL.prototype, "_url");
  Object.setPrototypeOf(FastURL$1.prototype, NativeURL.prototype);
  Object.setPrototypeOf(FastURL$1, NativeURL);
  return FastURL$1;
})();
function resolvePortAndHost(opts) {
  const _port = opts.port ?? globalThis.process?.env.PORT ?? 3e3;
  const port2 = typeof _port === "number" ? _port : Number.parseInt(_port, 10);
  if (port2 < 0 || port2 > 65535) throw new RangeError(`Port must be between 0 and 65535 (got "${port2}").`);
  return {
    port: port2,
    hostname: opts.hostname ?? globalThis.process?.env.HOST
  };
}
function fmtURL(host2, port2, secure) {
  if (!host2 || !port2) return;
  if (host2.includes(":")) host2 = `[${host2}]`;
  return `http${secure ? "s" : ""}://${host2}:${port2}/`;
}
function printListening(opts, url) {
  if (!url || (opts.silent ?? globalThis.process?.env?.TEST)) return;
  const _url = new URL(url);
  const allInterfaces = _url.hostname === "[::]" || _url.hostname === "0.0.0.0";
  if (allInterfaces) {
    _url.hostname = "localhost";
    url = _url.href;
  }
  let listeningOn = `➜ Listening on:`;
  let additionalInfo = allInterfaces ? " (all interfaces)" : "";
  if (globalThis.process.stdout?.isTTY) {
    listeningOn = `\x1B[32m${listeningOn}\x1B[0m`;
    url = `\x1B[36m${url}\x1B[0m`;
    additionalInfo = `\x1B[2m${additionalInfo}\x1B[0m`;
  }
  console.log(`${listeningOn} ${url}${additionalInfo}`);
}
function resolveTLSOptions(opts) {
  if (!opts.tls || opts.protocol === "http") return;
  const cert2 = resolveCertOrKey(opts.tls.cert);
  const key2 = resolveCertOrKey(opts.tls.key);
  if (!cert2 && !key2) {
    if (opts.protocol === "https") throw new TypeError("TLS `cert` and `key` must be provided for `https` protocol.");
    return;
  }
  if (!cert2 || !key2) throw new TypeError("TLS `cert` and `key` must be provided together.");
  return {
    cert: cert2,
    key: key2,
    passphrase: opts.tls.passphrase
  };
}
function resolveCertOrKey(value) {
  if (!value) return;
  if (typeof value !== "string") throw new TypeError("TLS certificate and key must be strings in PEM format or file paths.");
  if (value.startsWith("-----BEGIN ")) return value;
  const { readFileSync } = process.getBuiltinModule("node:fs");
  return readFileSync(value, "utf8");
}
function createWaitUntil() {
  const promises2 = /* @__PURE__ */ new Set();
  return {
    waitUntil: (promise) => {
      if (typeof promise?.then !== "function") return;
      promises2.add(Promise.resolve(promise).catch(console.error).finally(() => {
        promises2.delete(promise);
      }));
    },
    wait: () => {
      return Promise.all(promises2);
    }
  };
}
function wrapFetch(server) {
  const fetchHandler = server.options.fetch;
  const middleware = server.options.middleware || [];
  return middleware.length === 0 ? fetchHandler : (request) => callMiddleware$1(request, fetchHandler, middleware, 0);
}
function callMiddleware$1(request, fetchHandler, middleware, index) {
  if (index === middleware.length) return fetchHandler(request);
  return middleware[index](request, () => callMiddleware$1(request, fetchHandler, middleware, index + 1));
}
const errorPlugin = (server) => {
  const errorHandler2 = server.options.error;
  if (!errorHandler2) return;
  server.options.middleware.unshift((_req, next) => {
    try {
      const res = next();
      return res instanceof Promise ? res.catch((error) => errorHandler2(error)) : res;
    } catch (error) {
      return errorHandler2(error);
    }
  });
};
const gracefulShutdownPlugin = (server) => {
  const config = server.options?.gracefulShutdown;
  if (!globalThis.process?.on || config === false || config === void 0 && (process.env.CI || process.env.TEST)) return;
  const gracefulShutdown = config === true || !config?.gracefulTimeout ? Number.parseInt(process.env.SERVER_SHUTDOWN_TIMEOUT || "") || 3 : config.gracefulTimeout;
  const forceShutdown = config === true || !config?.forceTimeout ? Number.parseInt(process.env.SERVER_FORCE_SHUTDOWN_TIMEOUT || "") || 5 : config.forceTimeout;
  let isShuttingDown = false;
  const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    const w = process.stderr.write.bind(process.stderr);
    w(gray(`
Shutting down server in ${gracefulShutdown}s...`));
    let timeout;
    await Promise.race([server.close().finally(() => {
      clearTimeout(timeout);
      w(gray(" Server closed.\n"));
    }), new Promise((resolve2) => {
      timeout = setTimeout(() => {
        w(gray(`
Force closing connections in ${forceShutdown}s...`));
        timeout = setTimeout(() => {
          w(red("\nCould not close connections in time, force exiting."));
          resolve2();
        }, forceShutdown * 1e3);
        return server.close(true);
      }, gracefulShutdown * 1e3);
    })]);
    globalThis.process.exit(0);
  };
  for (const sig of ["SIGINT", "SIGTERM"]) globalThis.process.on(sig, shutdown);
};
const NodeResponse = /* @__PURE__ */ (() => {
  const NativeResponse = globalThis.Response;
  const STATUS_CODES = globalThis.process?.getBuiltinModule?.("node:http")?.STATUS_CODES || {};
  class NodeResponse$1 {
    #body;
    #init;
    #headers;
    #response;
    constructor(body, init) {
      this.#body = body;
      this.#init = init;
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeResponse;
    }
    get status() {
      return this.#response?.status || this.#init?.status || 200;
    }
    get statusText() {
      return this.#response?.statusText || this.#init?.statusText || STATUS_CODES[this.status] || "";
    }
    get headers() {
      if (this.#response) return this.#response.headers;
      if (this.#headers) return this.#headers;
      const initHeaders = this.#init?.headers;
      return this.#headers = initHeaders instanceof Headers ? initHeaders : new Headers(initHeaders);
    }
    get ok() {
      if (this.#response) return this.#response.ok;
      const status = this.status;
      return status >= 200 && status < 300;
    }
    get _response() {
      if (this.#response) return this.#response;
      this.#response = new NativeResponse(this.#body, this.#headers ? {
        ...this.#init,
        headers: this.#headers
      } : this.#init);
      this.#init = void 0;
      this.#headers = void 0;
      this.#body = void 0;
      return this.#response;
    }
    _toNodeResponse() {
      const status = this.status;
      const statusText = this.statusText;
      let body;
      let contentType;
      let contentLength;
      if (this.#response) body = this.#response.body;
      else if (this.#body) if (this.#body instanceof ReadableStream) body = this.#body;
      else if (typeof this.#body === "string") {
        body = this.#body;
        contentType = "text/plain; charset=UTF-8";
        contentLength = Buffer.byteLength(this.#body);
      } else if (this.#body instanceof ArrayBuffer) {
        body = Buffer.from(this.#body);
        contentLength = this.#body.byteLength;
      } else if (this.#body instanceof Uint8Array) {
        body = this.#body;
        contentLength = this.#body.byteLength;
      } else if (this.#body instanceof DataView) {
        body = Buffer.from(this.#body.buffer);
        contentLength = this.#body.byteLength;
      } else if (this.#body instanceof Blob) {
        body = this.#body.stream();
        contentType = this.#body.type;
        contentLength = this.#body.size;
      } else if (typeof this.#body.pipe === "function") body = this.#body;
      else body = this._response.body;
      const headers2 = [];
      const initHeaders = this.#init?.headers;
      const headerEntries = this.#response?.headers || this.#headers || (initHeaders ? Array.isArray(initHeaders) ? initHeaders : initHeaders?.entries ? initHeaders.entries() : Object.entries(initHeaders).map(([k, v]) => [k.toLowerCase(), v]) : void 0);
      let hasContentTypeHeader;
      let hasContentLength;
      if (headerEntries) for (const [key2, value] of headerEntries) {
        if (Array.isArray(value)) for (const v of value) headers2.push([key2, v]);
        else headers2.push([key2, value]);
        if (key2 === "content-type") hasContentTypeHeader = true;
        else if (key2 === "content-length") hasContentLength = true;
      }
      if (contentType && !hasContentTypeHeader) headers2.push(["content-type", contentType]);
      if (contentLength && !hasContentLength) headers2.push(["content-length", String(contentLength)]);
      this.#init = void 0;
      this.#headers = void 0;
      this.#response = void 0;
      this.#body = void 0;
      return {
        status,
        statusText,
        headers: headers2,
        body
      };
    }
  }
  lazyInherit(NodeResponse$1.prototype, NativeResponse.prototype, "_response");
  Object.setPrototypeOf(NodeResponse$1, NativeResponse);
  Object.setPrototypeOf(NodeResponse$1.prototype, NativeResponse.prototype);
  return NodeResponse$1;
})();
async function sendNodeResponse(nodeRes, webRes) {
  if (!webRes) {
    nodeRes.statusCode = 500;
    return endNodeResponse(nodeRes);
  }
  if (webRes._toNodeResponse) {
    const res = webRes._toNodeResponse();
    writeHead(nodeRes, res.status, res.statusText, res.headers);
    if (res.body) {
      if (res.body instanceof ReadableStream) return streamBody(res.body, nodeRes);
      else if (typeof res.body?.pipe === "function") {
        res.body.pipe(nodeRes);
        return new Promise((resolve2) => nodeRes.on("close", resolve2));
      }
      nodeRes.write(res.body);
    }
    return endNodeResponse(nodeRes);
  }
  const rawHeaders = [...webRes.headers];
  writeHead(nodeRes, webRes.status, webRes.statusText, rawHeaders);
  return webRes.body ? streamBody(webRes.body, nodeRes) : endNodeResponse(nodeRes);
}
function writeHead(nodeRes, status, statusText, rawHeaders) {
  const writeHeaders = globalThis.Deno ? rawHeaders : rawHeaders.flat();
  if (!nodeRes.headersSent) if (nodeRes.req?.httpVersion === "2.0") nodeRes.writeHead(status, writeHeaders);
  else nodeRes.writeHead(status, statusText, writeHeaders);
}
function endNodeResponse(nodeRes) {
  return new Promise((resolve2) => nodeRes.end(resolve2));
}
function streamBody(stream, nodeRes) {
  if (nodeRes.destroyed) {
    stream.cancel();
    return;
  }
  const reader = stream.getReader();
  function streamCancel(error) {
    reader.cancel(error).catch(() => {
    });
    if (error) nodeRes.destroy(error);
  }
  function streamHandle({ done, value }) {
    try {
      if (done) nodeRes.end();
      else if (nodeRes.write(value)) reader.read().then(streamHandle, streamCancel);
      else nodeRes.once("drain", () => reader.read().then(streamHandle, streamCancel));
    } catch (error) {
      streamCancel(error instanceof Error ? error : void 0);
    }
  }
  nodeRes.on("close", streamCancel);
  nodeRes.on("error", streamCancel);
  reader.read().then(streamHandle, streamCancel);
  return reader.closed.catch(streamCancel).finally(() => {
    nodeRes.off("close", streamCancel);
    nodeRes.off("error", streamCancel);
  });
}
var NodeRequestURL = class extends FastURL {
  #req;
  constructor({ req }) {
    const path = req.url || "/";
    if (path[0] === "/") {
      const qIndex = path.indexOf("?");
      const pathname = qIndex === -1 ? path : path?.slice(0, qIndex) || "/";
      const search = qIndex === -1 ? "" : path?.slice(qIndex) || "";
      const host2 = req.headers.host || req.headers[":authority"] || `${req.socket.localFamily === "IPv6" ? "[" + req.socket.localAddress + "]" : req.socket.localAddress}:${req.socket?.localPort || "80"}`;
      const protocol = req.socket?.encrypted || req.headers["x-forwarded-proto"] === "https" || req.headers[":scheme"] === "https" ? "https:" : "http:";
      super({
        protocol,
        host: host2,
        pathname,
        search
      });
    } else super(path);
    this.#req = req;
  }
  get pathname() {
    return super.pathname;
  }
  set pathname(value) {
    this._url.pathname = value;
    this.#req.url = this._url.pathname + this._url.search;
  }
};
const NodeRequestHeaders = /* @__PURE__ */ (() => {
  const NativeHeaders = globalThis.Headers;
  class Headers2 {
    #req;
    #headers;
    constructor(req) {
      this.#req = req;
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeHeaders;
    }
    get _headers() {
      if (!this.#headers) {
        const headers2 = new NativeHeaders();
        const rawHeaders = this.#req.rawHeaders;
        const len = rawHeaders.length;
        for (let i = 0; i < len; i += 2) {
          const key2 = rawHeaders[i];
          if (key2.charCodeAt(0) === 58) continue;
          const value = rawHeaders[i + 1];
          headers2.append(key2, value);
        }
        this.#headers = headers2;
      }
      return this.#headers;
    }
    get(name) {
      if (this.#headers) return this.#headers.get(name);
      const value = this.#req.headers[name.toLowerCase()];
      return Array.isArray(value) ? value.join(", ") : value || null;
    }
    has(name) {
      if (this.#headers) return this.#headers.has(name);
      return name.toLowerCase() in this.#req.headers;
    }
    getSetCookie() {
      if (this.#headers) return this.#headers.getSetCookie();
      const value = this.#req.headers["set-cookie"];
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    *_entries() {
      const rawHeaders = this.#req.rawHeaders;
      const len = rawHeaders.length;
      for (let i = 0; i < len; i += 2) {
        const key2 = rawHeaders[i];
        if (key2.charCodeAt(0) === 58) continue;
        yield [key2.toLowerCase(), rawHeaders[i + 1]];
      }
    }
    entries() {
      return this.#headers ? this.#headers.entries() : this._entries();
    }
    [Symbol.iterator]() {
      return this.entries();
    }
  }
  lazyInherit(Headers2.prototype, NativeHeaders.prototype, "_headers");
  Object.setPrototypeOf(Headers2, NativeHeaders);
  Object.setPrototypeOf(Headers2.prototype, NativeHeaders.prototype);
  return Headers2;
})();
const NodeRequest = /* @__PURE__ */ (() => {
  const NativeRequest = globalThis[Symbol.for("srvx.nativeRequest")] ??= globalThis.Request;
  const PatchedRequest = class Request$1 extends NativeRequest {
    static _srvx = true;
    static [Symbol.hasInstance](instance) {
      if (this === PatchedRequest) return instance instanceof NativeRequest;
      else return Object.prototype.isPrototypeOf.call(this.prototype, instance);
    }
    constructor(input, options) {
      if (typeof input === "object" && "_request" in input) input = input._request;
      if (options?.body?.getReader !== void 0) options.duplex ??= "half";
      super(input, options);
    }
  };
  if (!globalThis.Request._srvx) globalThis.Request = PatchedRequest;
  class Request2 {
    runtime;
    #req;
    #url;
    #bodyStream;
    #request;
    #headers;
    #abortController;
    constructor(ctx) {
      this.#req = ctx.req;
      this.runtime = {
        name: "node",
        node: ctx
      };
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeRequest;
    }
    get ip() {
      return this.#req.socket?.remoteAddress;
    }
    get method() {
      if (this.#request) return this.#request.method;
      return this.#req.method || "GET";
    }
    get _url() {
      return this.#url ||= new NodeRequestURL({ req: this.#req });
    }
    set _url(url) {
      this.#url = url;
    }
    get url() {
      if (this.#request) return this.#request.url;
      return this._url.href;
    }
    get headers() {
      if (this.#request) return this.#request.headers;
      return this.#headers ||= new NodeRequestHeaders(this.#req);
    }
    get _abortController() {
      if (!this.#abortController) {
        this.#abortController = new AbortController();
        const req = this.#req;
        const abort = (err) => {
          this.#abortController?.abort?.(err);
        };
        req.once("error", abort);
        req.once("end", abort);
      }
      return this.#abortController;
    }
    get signal() {
      return this.#request ? this.#request.signal : this._abortController.signal;
    }
    get body() {
      if (this.#request) return this.#request.body;
      if (this.#bodyStream === void 0) {
        const method = this.method;
        this.#bodyStream = !(method === "GET" || method === "HEAD") ? Readable.toWeb(this.#req) : null;
      }
      return this.#bodyStream;
    }
    text() {
      if (this.#request) return this.#request.text();
      if (this.#bodyStream !== void 0) return this.#bodyStream ? new Response(this.#bodyStream).text() : Promise.resolve("");
      return readBody(this.#req).then((buf) => buf.toString());
    }
    json() {
      if (this.#request) return this.#request.json();
      return this.text().then((text) => JSON.parse(text));
    }
    get _request() {
      if (!this.#request) {
        this.#request = new PatchedRequest(this.url, {
          method: this.method,
          headers: this.headers,
          body: this.body,
          signal: this._abortController.signal
        });
        this.#headers = void 0;
        this.#bodyStream = void 0;
      }
      return this.#request;
    }
  }
  lazyInherit(Request2.prototype, NativeRequest.prototype, "_request");
  Object.setPrototypeOf(Request2.prototype, NativeRequest.prototype);
  return Request2;
})();
function readBody(req) {
  return new Promise((resolve2, reject) => {
    const chunks = [];
    const onData = (chunk) => {
      chunks.push(chunk);
    };
    const onError = (err) => {
      reject(err);
    };
    const onEnd = () => {
      req.off("error", onError);
      req.off("data", onData);
      resolve2(Buffer.concat(chunks));
    };
    req.on("data", onData).once("end", onEnd).once("error", onError);
  });
}
function serve(options) {
  return new NodeServer(options);
}
var NodeServer = class {
  runtime = "node";
  options;
  node;
  serveOptions;
  fetch;
  #isSecure;
  #listeningPromise;
  #wait;
  constructor(options) {
    this.options = {
      ...options,
      middleware: [...options.middleware || []]
    };
    for (const plugin of options.plugins || []) plugin(this);
    errorPlugin(this);
    gracefulShutdownPlugin(this);
    const fetchHandler = this.fetch = wrapFetch(this);
    this.#wait = createWaitUntil();
    const handler = (nodeReq, nodeRes) => {
      const request = new NodeRequest({
        req: nodeReq,
        res: nodeRes
      });
      request.waitUntil = this.#wait.waitUntil;
      const res = fetchHandler(request);
      return res instanceof Promise ? res.then((resolvedRes) => sendNodeResponse(nodeRes, resolvedRes)) : sendNodeResponse(nodeRes, res);
    };
    const tls = resolveTLSOptions(this.options);
    const { port: port2, hostname: host2 } = resolvePortAndHost(this.options);
    this.serveOptions = {
      port: port2,
      host: host2,
      exclusive: !this.options.reusePort,
      ...tls ? {
        cert: tls.cert,
        key: tls.key,
        passphrase: tls.passphrase
      } : {},
      ...this.options.node
    };
    let server;
    this.#isSecure = !!this.serveOptions.cert && this.options.protocol !== "http";
    if (this.options.node?.http2 ?? this.#isSecure) if (this.#isSecure) server = nodeHTTP2.createSecureServer({
      allowHTTP1: true,
      ...this.serveOptions
    }, handler);
    else throw new Error("node.http2 option requires tls certificate!");
    else if (this.#isSecure) server = nodeHTTPS.createServer(this.serveOptions, handler);
    else server = nodeHTTP.createServer(this.serveOptions, handler);
    this.node = {
      server,
      handler
    };
    if (!options.manual) this.serve();
  }
  serve() {
    if (this.#listeningPromise) return Promise.resolve(this.#listeningPromise).then(() => this);
    this.#listeningPromise = new Promise((resolve2) => {
      this.node.server.listen(this.serveOptions, () => {
        printListening(this.options, this.url);
        resolve2();
      });
    });
  }
  get url() {
    const addr = this.node?.server?.address();
    if (!addr) return;
    return typeof addr === "string" ? addr : fmtURL(addr.address, addr.port, this.#isSecure);
  }
  ready() {
    return Promise.resolve(this.#listeningPromise).then(() => this);
  }
  async close(closeAll) {
    await Promise.all([this.#wait.wait(), new Promise((resolve2, reject) => {
      const server = this.node?.server;
      if (!server) return resolve2();
      if (closeAll && "closeAllConnections" in server) server.closeAllConnections();
      server.close((error) => error ? reject(error) : resolve2());
    })]);
  }
};
const NullProtoObj = /* @__PURE__ */ (() => {
  const e = function() {
  };
  return e.prototype = /* @__PURE__ */ Object.create(null), Object.freeze(e.prototype), e;
})();
const kEventNS = "h3.internal.event.";
const kEventRes = /* @__PURE__ */ Symbol.for(`${kEventNS}res`);
const kEventResHeaders = /* @__PURE__ */ Symbol.for(`${kEventNS}res.headers`);
var H3Event = class {
  app;
  req;
  url;
  context;
  static __is_event__ = true;
  constructor(req, context, app) {
    this.context = context || req.context || new NullProtoObj();
    this.req = req;
    this.app = app;
    const _url = req._url;
    this.url = _url && _url instanceof URL ? _url : new FastURL(req.url);
  }
  get res() {
    return this[kEventRes] ||= new H3EventResponse();
  }
  get runtime() {
    return this.req.runtime;
  }
  waitUntil(promise) {
    this.req.waitUntil?.(promise);
  }
  toString() {
    return `[${this.req.method}] ${this.req.url}`;
  }
  toJSON() {
    return this.toString();
  }
  get node() {
    return this.req.runtime?.node;
  }
  get headers() {
    return this.req.headers;
  }
  get path() {
    return this.url.pathname + this.url.search;
  }
  get method() {
    return this.req.method;
  }
};
var H3EventResponse = class {
  status;
  statusText;
  get headers() {
    return this[kEventResHeaders] ||= new Headers();
  }
};
const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) return defaultStatusCode;
  if (typeof statusCode === "string") statusCode = +statusCode;
  if (statusCode < 100 || statusCode > 599) return defaultStatusCode;
  return statusCode;
}
var HTTPError = class HTTPError2 extends Error {
  get name() {
    return "HTTPError";
  }
  status;
  statusText;
  headers;
  cause;
  data;
  body;
  unhandled;
  static isError(input) {
    return input instanceof Error && input?.name === "HTTPError";
  }
  static status(status, statusText, details) {
    return new HTTPError2({
      ...details,
      statusText,
      status
    });
  }
  constructor(arg1, arg2) {
    let messageInput;
    let details;
    if (typeof arg1 === "string") {
      messageInput = arg1;
      details = arg2;
    } else details = arg1;
    const status = sanitizeStatusCode(details?.status || details?.cause?.status || details?.status || details?.statusCode, 500);
    const statusText = sanitizeStatusMessage(details?.statusText || details?.cause?.statusText || details?.statusText || details?.statusMessage);
    const message = messageInput || details?.message || details?.cause?.message || details?.statusText || details?.statusMessage || [
      "HTTPError",
      status,
      statusText
    ].filter(Boolean).join(" ");
    super(message, { cause: details });
    this.cause = details;
    Error.captureStackTrace?.(this, this.constructor);
    this.status = status;
    this.statusText = statusText || void 0;
    const rawHeaders = details?.headers || details?.cause?.headers;
    this.headers = rawHeaders ? new Headers(rawHeaders) : void 0;
    this.unhandled = details?.unhandled ?? details?.cause?.unhandled ?? void 0;
    this.data = details?.data;
    this.body = details?.body;
  }
  get statusCode() {
    return this.status;
  }
  get statusMessage() {
    return this.statusText;
  }
  toJSON() {
    const unhandled = this.unhandled;
    return {
      status: this.status,
      statusText: this.statusText,
      unhandled,
      message: unhandled ? "HTTPError" : this.message,
      data: unhandled ? void 0 : this.data,
      ...unhandled ? void 0 : this.body
    };
  }
};
function isJSONSerializable(value, _type) {
  if (value === null || value === void 0) return true;
  if (_type !== "object") return _type === "boolean" || _type === "number" || _type === "string";
  if (typeof value.toJSON === "function") return true;
  if (Array.isArray(value)) return true;
  if (typeof value.pipe === "function" || typeof value.pipeTo === "function") return false;
  if (value instanceof NullProtoObj) return true;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
const kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");
const kHandled = /* @__PURE__ */ Symbol.for("h3.handled");
function toResponse(val, event, config = {}) {
  if (typeof val?.then === "function") return (val.catch?.((error) => error) || Promise.resolve(val)).then((resolvedVal) => toResponse(resolvedVal, event, config));
  const response = prepareResponse(val, event, config);
  if (typeof response?.then === "function") return toResponse(response, event, config);
  const { onResponse: onResponse$1 } = config;
  return onResponse$1 ? Promise.resolve(onResponse$1(response, event)).then(() => response) : response;
}
var HTTPResponse = class {
  #headers;
  #init;
  body;
  constructor(body, init) {
    this.body = body;
    this.#init = init;
  }
  get status() {
    return this.#init?.status || 200;
  }
  get statusText() {
    return this.#init?.statusText || "OK";
  }
  get headers() {
    return this.#headers ||= new Headers(this.#init?.headers);
  }
};
function prepareResponse(val, event, config, nested) {
  if (val === kHandled) return new NodeResponse(null);
  if (val === kNotFound) val = new HTTPError({
    status: 404,
    message: `Cannot find any route matching [${event.req.method}] ${event.url}`
  });
  if (val && val instanceof Error) {
    const isHTTPError = HTTPError.isError(val);
    const error = isHTTPError ? val : new HTTPError(val);
    if (!isHTTPError) {
      error.unhandled = true;
      if (val?.stack) error.stack = val.stack;
    }
    if (error.unhandled && !config.silent) console.error(error);
    const { onError: onError$1 } = config;
    return onError$1 && !nested ? Promise.resolve(onError$1(error, event)).catch((error$1) => error$1).then((newVal) => prepareResponse(newVal ?? val, event, config, true)) : errorResponse(error, config.debug);
  }
  const preparedRes = event[kEventRes];
  const preparedHeaders = preparedRes?.[kEventResHeaders];
  if (!(val instanceof Response)) {
    const res = prepareResponseBody(val, event, config);
    const status = res.status || preparedRes?.status;
    return new NodeResponse(nullBody(event.req.method, status) ? null : res.body, {
      status,
      statusText: res.statusText || preparedRes?.statusText,
      headers: res.headers && preparedHeaders ? mergeHeaders$1(res.headers, preparedHeaders) : res.headers || preparedHeaders
    });
  }
  if (!preparedHeaders || nested || !val.ok) return val;
  try {
    mergeHeaders$1(val.headers, preparedHeaders, val.headers);
    return val;
  } catch {
    return new NodeResponse(nullBody(event.req.method, val.status) ? null : val.body, {
      status: val.status,
      statusText: val.statusText,
      headers: mergeHeaders$1(val.headers, preparedHeaders)
    });
  }
}
function mergeHeaders$1(base, overrides, target = new Headers(base)) {
  for (const [name, value] of overrides) if (name === "set-cookie") target.append(name, value);
  else target.set(name, value);
  return target;
}
const frozenHeaders = () => {
  throw new Error("Headers are frozen");
};
var FrozenHeaders = class extends Headers {
  constructor(init) {
    super(init);
    this.set = this.append = this.delete = frozenHeaders;
  }
};
const emptyHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-length": "0" });
const jsonHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-type": "application/json;charset=UTF-8" });
function prepareResponseBody(val, event, config) {
  if (val === null || val === void 0) return {
    body: "",
    headers: emptyHeaders
  };
  const valType = typeof val;
  if (valType === "string") return { body: val };
  if (val instanceof Uint8Array) {
    event.res.headers.set("content-length", val.byteLength.toString());
    return { body: val };
  }
  if (val instanceof HTTPResponse || val?.constructor?.name === "HTTPResponse") return val;
  if (isJSONSerializable(val, valType)) return {
    body: JSON.stringify(val, void 0, config.debug ? 2 : void 0),
    headers: jsonHeaders
  };
  if (valType === "bigint") return {
    body: val.toString(),
    headers: jsonHeaders
  };
  if (val instanceof Blob) {
    const headers2 = new Headers({
      "content-type": val.type,
      "content-length": val.size.toString()
    });
    let filename = val.name;
    if (filename) {
      filename = encodeURIComponent(filename);
      headers2.set("content-disposition", `filename="${filename}"; filename*=UTF-8''${filename}`);
    }
    return {
      body: val.stream(),
      headers: headers2
    };
  }
  if (valType === "symbol") return { body: val.toString() };
  if (valType === "function") return { body: `${val.name}()` };
  return { body: val };
}
function nullBody(method, status) {
  return method === "HEAD" || status === 100 || status === 101 || status === 102 || status === 204 || status === 205 || status === 304;
}
function errorResponse(error, debug) {
  return new NodeResponse(JSON.stringify({
    ...error.toJSON(),
    stack: debug && error.stack ? error.stack.split("\n").map((l) => l.trim()) : void 0
  }, void 0, debug ? 2 : void 0), {
    status: error.status,
    statusText: error.statusText,
    headers: error.headers ? mergeHeaders$1(jsonHeaders, error.headers) : new Headers(jsonHeaders)
  });
}
function callMiddleware(event, middleware, handler, index = 0) {
  if (index === middleware.length) return handler(event);
  const fn = middleware[index];
  let nextCalled;
  let nextResult;
  const next = () => {
    if (nextCalled) return nextResult;
    nextCalled = true;
    nextResult = callMiddleware(event, middleware, handler, index + 1);
    return nextResult;
  };
  const ret = fn(event, next);
  return isUnhandledResponse(ret) ? next() : typeof ret?.then === "function" ? ret.then((resolved) => isUnhandledResponse(resolved) ? next() : resolved) : ret;
}
function isUnhandledResponse(val) {
  return val === void 0 || val === kNotFound;
}
function toRequest(input, options) {
  if (typeof input === "string") {
    let url = input;
    if (url[0] === "/") {
      const host2 = "localhost";
      url = `${"http"}://${host2}${url}`;
    }
    return new Request(url, options);
  } else if (input instanceof URL) return new Request(input, options);
  return input;
}
function defineHandler(input) {
  if (typeof input === "function") return handlerWithFetch(input);
  const handler = input.handler || (input.fetch ? function _fetchHandler(event) {
    return input.fetch(event.req);
  } : NoHandler);
  return Object.assign(handlerWithFetch(input.middleware?.length ? function _handlerMiddleware(event) {
    return callMiddleware(event, input.middleware, handler);
  } : handler), input);
}
function handlerWithFetch(handler) {
  if ("fetch" in handler) return handler;
  return Object.assign(handler, { fetch: (req) => {
    if (typeof req === "string") req = new URL(req, "http://_");
    if (req instanceof URL) req = new Request(req);
    const event = new H3Event(req);
    try {
      return Promise.resolve(toResponse(handler(event), event));
    } catch (error) {
      return Promise.resolve(toResponse(error, event));
    }
  } });
}
function defineLazyEventHandler(loader) {
  let handler;
  let promise;
  const resolveLazyHandler = () => {
    if (handler) return Promise.resolve(handler);
    return promise ??= Promise.resolve(loader()).then((r) => {
      handler = toEventHandler(r) || toEventHandler(r.default);
      if (typeof handler !== "function") throw new TypeError("Invalid lazy handler", { cause: { resolved: r } });
      return handler;
    });
  };
  return defineHandler(function lazyHandler(event) {
    return handler ? handler(event) : resolveLazyHandler().then((r) => r(event));
  });
}
function toEventHandler(handler) {
  if (typeof handler === "function") return handler;
  if (typeof handler?.handler === "function") return handler.handler;
  if (typeof handler?.fetch === "function") return function _fetchHandler(event) {
    return handler.fetch(event.req);
  };
}
const NoHandler = () => kNotFound;
var H3Core = class {
  config;
  "~middleware";
  "~routes" = [];
  constructor(config = {}) {
    this["~middleware"] = [];
    this.config = config;
    this.fetch = this.fetch.bind(this);
    this.handler = this.handler.bind(this);
  }
  fetch(request) {
    return this["~request"](request);
  }
  handler(event) {
    const route = this["~findRoute"](event);
    if (route) {
      event.context.params = route.params;
      event.context.matchedRoute = route.data;
    }
    const routeHandler = route?.data.handler || NoHandler;
    const middleware = this["~getMiddleware"](event, route);
    return middleware.length > 0 ? callMiddleware(event, middleware, routeHandler) : routeHandler(event);
  }
  "~request"(request, context) {
    const event = new H3Event(request, context, this);
    let handlerRes;
    try {
      if (this.config.onRequest) {
        const hookRes = this.config.onRequest(event);
        handlerRes = typeof hookRes?.then === "function" ? hookRes.then(() => this.handler(event)) : this.handler(event);
      } else handlerRes = this.handler(event);
    } catch (error) {
      handlerRes = Promise.reject(error);
    }
    return toResponse(handlerRes, event, this.config);
  }
  "~findRoute"(_event) {
  }
  "~addRoute"(_route) {
    this["~routes"].push(_route);
  }
  "~getMiddleware"(_event, route) {
    const routeMiddleware = route?.data.middleware;
    const globalMiddleware2 = this["~middleware"];
    return routeMiddleware ? [...globalMiddleware2, ...routeMiddleware] : globalMiddleware2;
  }
};
const errorHandler$1 = (error, event) => {
  const res = defaultHandler(error, event);
  return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled;
  const status = error.status || 500;
  const url = event.url || new URL(event.req.url);
  if (status === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.req.method}] ${url}
`, error);
  }
  const headers2 = {
    "content-type": "application/json",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  if (status === 404 || !event.res.headers.has("cache-control")) {
    headers2["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    status,
    statusText: error.statusText,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status,
    statusText: error.statusText,
    headers: headers2,
    body
  };
}
const errorHandlers = [errorHandler$1];
async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch (error2) {
      console.error(error2);
    }
  }
}
const ENC_SLASH_RE = /%2f/gi;
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode(text.replace(ENC_SLASH_RE, "%252F"));
}
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/");
  }
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/") ? input : input + "/";
  }
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
const headers = ((m) => function headersRouteRule(event) {
  for (const [key2, value] of Object.entries(m.options || {})) {
    event.res.headers.set(key2, value);
  }
});
const assets = {
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": '"f1e-ESBTjHetHyiokkO0tT/irBbMO8Y"',
    "mtime": "2025-12-01T17:49:02.157Z",
    "size": 3870,
    "path": "../public/favicon.ico"
  },
  "/logo192.png": {
    "type": "image/png",
    "etag": '"14e3-f08taHgqf6/O2oRVTsq5tImHdQA"',
    "mtime": "2025-12-01T17:49:02.157Z",
    "size": 5347,
    "path": "../public/logo192.png"
  },
  "/logo512.png": {
    "type": "image/png",
    "etag": '"25c0-RpFfnQJpTtSb/HqVNJR2hBA9w/4"',
    "mtime": "2025-12-01T17:49:02.157Z",
    "size": 9664,
    "path": "../public/logo512.png"
  },
  "/manifest.json": {
    "type": "application/json",
    "etag": '"1f2-Oqn/x1R1hBTtEjA8nFhpBeFJJNg"',
    "mtime": "2025-12-01T17:49:02.157Z",
    "size": 498,
    "path": "../public/manifest.json"
  },
  "/robots.txt": {
    "type": "text/plain; charset=utf-8",
    "etag": '"43-BEzmj4PuhUNHX+oW9uOnPSihxtU"',
    "mtime": "2025-12-01T17:49:02.158Z",
    "size": 67,
    "path": "../public/robots.txt"
  },
  "/tanstack-circle-logo.png": {
    "type": "image/png",
    "etag": '"40cab-HZ1KcYPs7tRjLe4Sd4g6CwKW+W8"',
    "mtime": "2025-12-01T17:49:02.158Z",
    "size": 265387,
    "path": "../public/tanstack-circle-logo.png"
  },
  "/tanstack-word-logo-white.svg": {
    "type": "image/svg+xml",
    "etag": '"3a9a-9TQFm/pN8AZe1ZK0G1KyCEojnYg"',
    "mtime": "2025-12-01T17:49:02.159Z",
    "size": 15002,
    "path": "../public/tanstack-word-logo-white.svg"
  },
  "/assets/_characterId-DMDZo1Lu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"13bc-BXiPA+Rq3/w/jBtXliwCYKMQ1fo"',
    "mtime": "2025-12-01T17:49:02.348Z",
    "size": 5052,
    "path": "../public/assets/_characterId-DMDZo1Lu.js"
  },
  "/assets/_sessionId-BDbfv6nl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"13de-C/yhjEIHFvcObY+RjiKRB5yHjSY"',
    "mtime": "2025-12-01T17:49:02.348Z",
    "size": 5086,
    "path": "../public/assets/_sessionId-BDbfv6nl.js"
  },
  "/assets/fixed-action-bar-CndZkYAJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"7e82-/9giV8TD/P6pWObVIAGFRGX+sGc"',
    "mtime": "2025-12-01T17:49:02.348Z",
    "size": 32386,
    "path": "../public/assets/fixed-action-bar-CndZkYAJ.js"
  },
  "/assets/index-apBqiB4Q.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e0c2-ZwM06L+zHA6uVj3DggpXfkLZQ4Y"',
    "mtime": "2025-12-01T17:49:02.348Z",
    "size": 57538,
    "path": "../public/assets/index-apBqiB4Q.js"
  },
  "/assets/main-yqHpe1eZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"54d8e-ZUkcCT/a6zbFoPjjKdM8ii+Z2xg"',
    "mtime": "2025-12-01T17:49:02.348Z",
    "size": 347534,
    "path": "../public/assets/main-yqHpe1eZ.js"
  },
  "/assets/styles-fs225yW2.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"6c22-TIhtIcSeljROFIrq6fVFL1Yv5ww"',
    "mtime": "2025-12-01T17:49:02.348Z",
    "size": 27682,
    "path": "../public/assets/styles-fs225yW2.css"
  },
  "/assets/utils-CzsQJ_QZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"85-tPnx7sm+RFbPbYcexgoJC6A8/II"',
    "mtime": "2025-12-01T17:49:02.348Z",
    "size": 133,
    "path": "../public/assets/utils-CzsQJ_QZ.js"
  },
  "/assets/audio-sources/granular-synth.png": {
    "type": "image/png",
    "etag": '"2ba0-6oq1CmzfxXhTt81YtVjxlowNSvA"',
    "mtime": "2025-12-01T17:49:02.131Z",
    "size": 11168,
    "path": "../public/assets/audio-sources/granular-synth.png"
  },
  "/assets/audio-sources/microphone-input.png": {
    "type": "image/png",
    "etag": '"2ecb-siNAFj63ALPUyAvnZ+hNMb5uiI4"',
    "mtime": "2025-12-01T17:49:02.131Z",
    "size": 11979,
    "path": "../public/assets/audio-sources/microphone-input.png"
  },
  "/assets/audio-sources/noise.png": {
    "type": "image/png",
    "etag": '"3c3b-AdYA0p2tuHBMViaeIHYhJZDbX60"',
    "mtime": "2025-12-01T17:49:02.132Z",
    "size": 15419,
    "path": "../public/assets/audio-sources/noise.png"
  },
  "/assets/audio-sources/physical-mod-generic.png": {
    "type": "image/png",
    "etag": '"2b87-Xl20vPEn/s8SlOUSjUt7iRWDGl4"',
    "mtime": "2025-12-01T17:49:02.132Z",
    "size": 11143,
    "path": "../public/assets/audio-sources/physical-mod-generic.png"
  },
  "/assets/audio-sources/physical-mod-membrane.png": {
    "type": "image/png",
    "etag": '"3140-fq2W7jPbUZKk9tY74ATgEeY6oYs"',
    "mtime": "2025-12-01T17:49:02.133Z",
    "size": 12608,
    "path": "../public/assets/audio-sources/physical-mod-membrane.png"
  },
  "/assets/audio-sources/physical-mod-pipe.png": {
    "type": "image/png",
    "etag": '"2ca4-TkwAiqz+65fQs75zetudmOPrybo"',
    "mtime": "2025-12-01T17:49:02.133Z",
    "size": 11428,
    "path": "../public/assets/audio-sources/physical-mod-pipe.png"
  },
  "/assets/audio-sources/physical-mod-string.png": {
    "type": "image/png",
    "etag": '"356d-N8/p4M4sOtFgT7380zuWdZMwPMY"',
    "mtime": "2025-12-01T17:49:02.133Z",
    "size": 13677,
    "path": "../public/assets/audio-sources/physical-mod-string.png"
  },
  "/assets/audio-sources/sample-player.png": {
    "type": "image/png",
    "etag": '"2828-rmOnerNrrq+1ylu21ktBMvxPEgc"',
    "mtime": "2025-12-01T17:49:02.134Z",
    "size": 10280,
    "path": "../public/assets/audio-sources/sample-player.png"
  },
  "/assets/audio-sources/sample-rec.png": {
    "type": "image/png",
    "etag": '"2aba-ST0qbIdu+BmFnUu2LCERnp+mldY"',
    "mtime": "2025-12-01T17:49:02.134Z",
    "size": 10938,
    "path": "../public/assets/audio-sources/sample-rec.png"
  },
  "/assets/audio-sources/speech-synthesis.png": {
    "type": "image/png",
    "etag": '"2d60-cD4cqXC+igdEIPlHd2ydal94aAM"',
    "mtime": "2025-12-01T17:49:02.134Z",
    "size": 11616,
    "path": "../public/assets/audio-sources/speech-synthesis.png"
  },
  "/assets/audio-sources/vco-pwm.png": {
    "type": "image/png",
    "etag": '"26fc-826sWiqSwJ578DuLU6PzU+IHfd0"',
    "mtime": "2025-12-01T17:49:02.134Z",
    "size": 9980,
    "path": "../public/assets/audio-sources/vco-pwm.png"
  },
  "/assets/audio-sources/vco-ramp.png": {
    "type": "image/png",
    "etag": '"2972-+H+vKjLa42BJYTPRBXNbO5Yz+7E"',
    "mtime": "2025-12-01T17:49:02.135Z",
    "size": 10610,
    "path": "../public/assets/audio-sources/vco-ramp.png"
  },
  "/assets/audio-sources/vco-saw.png": {
    "type": "image/png",
    "etag": '"29a7-l9OhT9+gh4BtOyJW3oBKH6ZriDU"',
    "mtime": "2025-12-01T17:49:02.135Z",
    "size": 10663,
    "path": "../public/assets/audio-sources/vco-saw.png"
  },
  "/assets/audio-sources/vco-sine.png": {
    "type": "image/png",
    "etag": '"2d89-Beo3A2nv7WquukmLlSEcN7zLU9E"',
    "mtime": "2025-12-01T17:49:02.135Z",
    "size": 11657,
    "path": "../public/assets/audio-sources/vco-sine.png"
  },
  "/assets/audio-sources/vco-square.png": {
    "type": "image/png",
    "etag": '"2439-/7VFDuCmmVjEdI86U/lTBE6ETzs"',
    "mtime": "2025-12-01T17:49:02.136Z",
    "size": 9273,
    "path": "../public/assets/audio-sources/vco-square.png"
  },
  "/assets/audio-sources/vco-triangle.png": {
    "type": "image/png",
    "etag": '"43a2-00wH2hvEBB1etQacfhFuPeaDMv4"',
    "mtime": "2025-12-01T17:49:02.136Z",
    "size": 17314,
    "path": "../public/assets/audio-sources/vco-triangle.png"
  },
  "/assets/audio-sources/vco-wavetable.png": {
    "type": "image/png",
    "etag": '"32bc-buLQMgpcT59Zkujw2RxPe2U/kwY"',
    "mtime": "2025-12-01T17:49:02.136Z",
    "size": 12988,
    "path": "../public/assets/audio-sources/vco-wavetable.png"
  },
  "/assets/audio-modifiers/attenuator.png": {
    "type": "image/png",
    "etag": '"2056-7csGE17fdJnTk0HsaURt83SkxBI"',
    "mtime": "2025-12-01T17:49:02.119Z",
    "size": 8278,
    "path": "../public/assets/audio-modifiers/attenuator.png"
  },
  "/assets/audio-modifiers/chorus.png": {
    "type": "image/png",
    "etag": '"24ed-ZSBR62dST7J36100QrBN30yYqJ4"',
    "mtime": "2025-12-01T17:49:02.119Z",
    "size": 9453,
    "path": "../public/assets/audio-modifiers/chorus.png"
  },
  "/assets/audio-modifiers/clipper.png": {
    "type": "image/png",
    "etag": '"22a6-sKBnqD502o5jRgBthrtyGxa9GlA"',
    "mtime": "2025-12-01T17:49:02.120Z",
    "size": 8870,
    "path": "../public/assets/audio-modifiers/clipper.png"
  },
  "/assets/audio-modifiers/crossfader.png": {
    "type": "image/png",
    "etag": '"1453-f0fa4QLMwbWYvKL5XiTKL5fRUvs"',
    "mtime": "2025-12-01T17:49:02.120Z",
    "size": 5203,
    "path": "../public/assets/audio-modifiers/crossfader.png"
  },
  "/assets/audio-modifiers/delay.png": {
    "type": "image/png",
    "etag": '"2880-dtZrBIV0ouIR0xvW34U5rvsYBYE"',
    "mtime": "2025-12-01T17:49:02.121Z",
    "size": 10368,
    "path": "../public/assets/audio-modifiers/delay.png"
  },
  "/assets/audio-modifiers/inverter.png": {
    "type": "image/png",
    "etag": '"272a-VbkAYt7+a5S8oCk8InlAB/UbBDs"',
    "mtime": "2025-12-01T17:49:02.121Z",
    "size": 10026,
    "path": "../public/assets/audio-modifiers/inverter.png"
  },
  "/assets/audio-modifiers/lpg.png": {
    "type": "image/png",
    "etag": '"1983-80QeaXhBLSeusNua+RYr4OzHeso"',
    "mtime": "2025-12-01T17:49:02.122Z",
    "size": 6531,
    "path": "../public/assets/audio-modifiers/lpg.png"
  },
  "/assets/audio-modifiers/mixer-inverting.png": {
    "type": "image/png",
    "etag": '"27f7-mg2tvOKPGFzcGOG2pADVSZEKts0"',
    "mtime": "2025-12-01T17:49:02.123Z",
    "size": 10231,
    "path": "../public/assets/audio-modifiers/mixer-inverting.png"
  },
  "/assets/audio-modifiers/mixer.png": {
    "type": "image/png",
    "etag": '"26c2-zdfZltrpUvTDmpQC/UQX7ghdHYI"',
    "mtime": "2025-12-01T17:49:02.123Z",
    "size": 9922,
    "path": "../public/assets/audio-modifiers/mixer.png"
  },
  "/assets/audio-modifiers/phase-shifter.png": {
    "type": "image/png",
    "etag": '"2873-pRxtau6bQgxK+G7o6heOvcNg8KU"',
    "mtime": "2025-12-01T17:49:02.123Z",
    "size": 10355,
    "path": "../public/assets/audio-modifiers/phase-shifter.png"
  },
  "/assets/audio-modifiers/rectifier-full.png": {
    "type": "image/png",
    "etag": '"2332-g8VIQw9V9toh+EvpGnKnMtP2Phg"',
    "mtime": "2025-12-01T17:49:02.124Z",
    "size": 9010,
    "path": "../public/assets/audio-modifiers/rectifier-full.png"
  },
  "/assets/audio-modifiers/rectifier-half.png": {
    "type": "image/png",
    "etag": '"1f61-HjP+FWwUUde/SwNd7oADmIhvBpo"',
    "mtime": "2025-12-01T17:49:02.124Z",
    "size": 8033,
    "path": "../public/assets/audio-modifiers/rectifier-half.png"
  },
  "/assets/audio-modifiers/resonator.png": {
    "type": "image/png",
    "etag": '"19a9-vO4mnng/lptFsspb4Bg4F5HrmZs"',
    "mtime": "2025-12-01T17:49:02.125Z",
    "size": 6569,
    "path": "../public/assets/audio-modifiers/resonator.png"
  },
  "/assets/audio-modifiers/reverb.png": {
    "type": "image/png",
    "etag": '"2241-1HGL9SPCNror8QnjoxGQGuX7r98"',
    "mtime": "2025-12-01T17:49:02.125Z",
    "size": 8769,
    "path": "../public/assets/audio-modifiers/reverb.png"
  },
  "/assets/audio-modifiers/ringmod.png": {
    "type": "image/png",
    "etag": '"16ab-uBxBuzmEsdQXLL4uLwnc6OcMMKs"',
    "mtime": "2025-12-01T17:49:02.125Z",
    "size": 5803,
    "path": "../public/assets/audio-modifiers/ringmod.png"
  },
  "/assets/audio-modifiers/switch.png": {
    "type": "image/png",
    "etag": '"1aa6-5hVzcXg7ohIcRz3EEeeAcJYyoVY"',
    "mtime": "2025-12-01T17:49:02.126Z",
    "size": 6822,
    "path": "../public/assets/audio-modifiers/switch.png"
  },
  "/assets/audio-modifiers/vca.png": {
    "type": "image/png",
    "etag": '"145c-HVcr6TdyK6c3xPlar9TaYvt/AgM"',
    "mtime": "2025-12-01T17:49:02.126Z",
    "size": 5212,
    "path": "../public/assets/audio-modifiers/vca.png"
  },
  "/assets/audio-modifiers/vcf-bandpass.png": {
    "type": "image/png",
    "etag": '"1ed2-vqG6O8x13yzzCKHBnsMmYFKThY0"',
    "mtime": "2025-12-01T17:49:02.127Z",
    "size": 7890,
    "path": "../public/assets/audio-modifiers/vcf-bandpass.png"
  },
  "/assets/audio-modifiers/vcf-comb.png": {
    "type": "image/png",
    "etag": '"22f2-u2yFmdnwb6GdPmgYK/Q44dLZR0k"',
    "mtime": "2025-12-01T17:49:02.127Z",
    "size": 8946,
    "path": "../public/assets/audio-modifiers/vcf-comb.png"
  },
  "/assets/audio-modifiers/vcf-highpass-res.png": {
    "type": "image/png",
    "etag": '"1ba1-QhthvNxWF0Afda45DBJbGxC0ems"',
    "mtime": "2025-12-01T17:49:02.128Z",
    "size": 7073,
    "path": "../public/assets/audio-modifiers/vcf-highpass-res.png"
  },
  "/assets/audio-modifiers/vcf-highpass.png": {
    "type": "image/png",
    "etag": '"18ab-Si1S+woLA/IQ/+PvGryuM9r3qo4"',
    "mtime": "2025-12-01T17:49:02.128Z",
    "size": 6315,
    "path": "../public/assets/audio-modifiers/vcf-highpass.png"
  },
  "/assets/audio-modifiers/vcf-lowpass-res.png": {
    "type": "image/png",
    "etag": '"1b61-TkQG50fIDdH0GzmFiYq3tFGVGkw"',
    "mtime": "2025-12-01T17:49:02.129Z",
    "size": 7009,
    "path": "../public/assets/audio-modifiers/vcf-lowpass-res.png"
  },
  "/assets/audio-modifiers/vcf-lowpass.png": {
    "type": "image/png",
    "etag": '"18ca-7QNM/rtmivrBV2uhsrMESkztk9o"',
    "mtime": "2025-12-01T17:49:02.129Z",
    "size": 6346,
    "path": "../public/assets/audio-modifiers/vcf-lowpass.png"
  },
  "/assets/audio-modifiers/vcf-notch.png": {
    "type": "image/png",
    "etag": '"1e03-CZcol8HIQGC0hsejogK5/lKJ+Rc"',
    "mtime": "2025-12-01T17:49:02.130Z",
    "size": 7683,
    "path": "../public/assets/audio-modifiers/vcf-notch.png"
  },
  "/assets/audio-modifiers/wavefolder.png": {
    "type": "image/png",
    "etag": '"28ae-8txBvrAssO8o+xQlCQ12pU9VzLo"',
    "mtime": "2025-12-01T17:49:02.130Z",
    "size": 10414,
    "path": "../public/assets/audio-modifiers/wavefolder.png"
  },
  "/assets/audio-modifiers/waveshaper.png": {
    "type": "image/png",
    "etag": '"2667-CYjcI1H6JBbc2aqVEZO8sn5Q9/w"',
    "mtime": "2025-12-01T17:49:02.131Z",
    "size": 9831,
    "path": "../public/assets/audio-modifiers/waveshaper.png"
  },
  "/assets/cv-sources/bias-voltage.png": {
    "type": "image/png",
    "etag": '"ca5-1BxBvMXJrVgONpwLOkop47rcjfE"',
    "mtime": "2025-12-01T17:49:02.147Z",
    "size": 3237,
    "path": "../public/assets/cv-sources/bias-voltage.png"
  },
  "/assets/cv-sources/cv-recorder.png": {
    "type": "image/png",
    "etag": '"1bb0-BO5HprcRGCdUW33xAHxwD3ejpc8"',
    "mtime": "2025-12-01T17:49:02.147Z",
    "size": 7088,
    "path": "../public/assets/cv-sources/cv-recorder.png"
  },
  "/assets/cv-sources/env-ad-loop.png": {
    "type": "image/png",
    "etag": '"1520-Gu+dPcBFQiginGPCufxHB6TixTc"',
    "mtime": "2025-12-01T17:49:02.148Z",
    "size": 5408,
    "path": "../public/assets/cv-sources/env-ad-loop.png"
  },
  "/assets/cv-sources/env-ad.png": {
    "type": "image/png",
    "etag": '"ff3-tDxAwJBCCQmsTu6wU25zoZ8yHHU"',
    "mtime": "2025-12-01T17:49:02.148Z",
    "size": 4083,
    "path": "../public/assets/cv-sources/env-ad.png"
  },
  "/assets/cv-sources/env-adsr-loop.png": {
    "type": "image/png",
    "etag": '"1a4c-Wva6J89gITrtCwBRxmS3RXVDI7s"',
    "mtime": "2025-12-01T17:49:02.149Z",
    "size": 6732,
    "path": "../public/assets/cv-sources/env-adsr-loop.png"
  },
  "/assets/cv-sources/env-adsr.png": {
    "type": "image/png",
    "etag": '"1437-MsQQKO4m3JsYwstJpJITXRAaL6E"',
    "mtime": "2025-12-01T17:49:02.149Z",
    "size": 5175,
    "path": "../public/assets/cv-sources/env-adsr.png"
  },
  "/assets/cv-sources/env-ahdsr-loop.png": {
    "type": "image/png",
    "etag": '"1870-8Bar53adExA3QY+oNWfKIitiNsw"',
    "mtime": "2025-12-01T17:49:02.149Z",
    "size": 6256,
    "path": "../public/assets/cv-sources/env-ahdsr-loop.png"
  },
  "/assets/cv-sources/env-ahdsr.png": {
    "type": "image/png",
    "etag": '"1253-zYk18M6r56oXdQMdQOBt4CacRtg"',
    "mtime": "2025-12-01T17:49:02.149Z",
    "size": 4691,
    "path": "../public/assets/cv-sources/env-ahdsr.png"
  },
  "/assets/cv-sources/env-ar-loop.png": {
    "type": "image/png",
    "etag": '"1621-BDm3F/J51/Ox5IDqbZeV5wJRZ/4"',
    "mtime": "2025-12-01T17:49:02.150Z",
    "size": 5665,
    "path": "../public/assets/cv-sources/env-ar-loop.png"
  },
  "/assets/cv-sources/env-ar.png": {
    "type": "image/png",
    "etag": '"1033-5MVI3hu0KYv7u/jRUfxzkWJYS+k"',
    "mtime": "2025-12-01T17:49:02.150Z",
    "size": 4147,
    "path": "../public/assets/cv-sources/env-ar.png"
  },
  "/assets/cv-sources/env-dadsr-loop.png": {
    "type": "image/png",
    "etag": '"1a77-FfpALmnoO8qLMptlPwk3LMw+7kQ"',
    "mtime": "2025-12-01T17:49:02.150Z",
    "size": 6775,
    "path": "../public/assets/cv-sources/env-dadsr-loop.png"
  },
  "/assets/cv-sources/env-dasdr.png": {
    "type": "image/png",
    "etag": '"1464-iXRXnQru3QfdMcAAaYItioZr8aY"',
    "mtime": "2025-12-01T17:49:02.151Z",
    "size": 5220,
    "path": "../public/assets/cv-sources/env-dasdr.png"
  },
  "/assets/cv-sources/envelope-follower.png": {
    "type": "image/png",
    "etag": '"2556-h+fk2qBdFWcoYo5duQc/FlwqUNQ"',
    "mtime": "2025-12-01T17:49:02.151Z",
    "size": 9558,
    "path": "../public/assets/cv-sources/envelope-follower.png"
  },
  "/assets/cv-sources/keyboard-ctrl.png": {
    "type": "image/png",
    "etag": '"8dd-dLiwmZbJpJO6RopDm8jLg9c09RI"',
    "mtime": "2025-12-01T17:49:02.151Z",
    "size": 2269,
    "path": "../public/assets/cv-sources/keyboard-ctrl.png"
  },
  "/assets/cv-sources/lfo-bpm-saw.png": {
    "type": "image/png",
    "etag": '"156c-W1hw0KeZx59ruAeLUDJkzGEkRss"',
    "mtime": "2025-12-01T17:49:02.151Z",
    "size": 5484,
    "path": "../public/assets/cv-sources/lfo-bpm-saw.png"
  },
  "/assets/cv-sources/lfo-bpm-sine.png": {
    "type": "image/png",
    "etag": '"19c4-7Mj2G/oDoQSLmGIAqeX6MWDyfLk"',
    "mtime": "2025-12-01T17:49:02.152Z",
    "size": 6596,
    "path": "../public/assets/cv-sources/lfo-bpm-sine.png"
  },
  "/assets/cv-sources/lfo-bpm-square.png": {
    "type": "image/png",
    "etag": '"fa3-eapUiwW8ovTVDglgF+S6qmSRZW4"',
    "mtime": "2025-12-01T17:49:02.152Z",
    "size": 4003,
    "path": "../public/assets/cv-sources/lfo-bpm-square.png"
  },
  "/assets/cv-sources/lfo-bpm-triangle.png": {
    "type": "image/png",
    "etag": '"159c-koWZkdRBBpyT4D5pFruQS0ZnQd0"',
    "mtime": "2025-12-01T17:49:02.152Z",
    "size": 5532,
    "path": "../public/assets/cv-sources/lfo-bpm-triangle.png"
  },
  "/assets/cv-sources/lfo-reset-sync.png": {
    "type": "image/png",
    "etag": '"15f7-pz9APvIHVBAJa2qTong6zRmXlzA"',
    "mtime": "2025-12-01T17:49:02.153Z",
    "size": 5623,
    "path": "../public/assets/cv-sources/lfo-reset-sync.png"
  },
  "/assets/cv-sources/lfo-saw.png": {
    "type": "image/png",
    "etag": '"1024-MoCoikpHGu6goC7gQNDxrfxlxN4"',
    "mtime": "2025-12-01T17:49:02.153Z",
    "size": 4132,
    "path": "../public/assets/cv-sources/lfo-saw.png"
  },
  "/assets/cv-sources/lfo-sine.png": {
    "type": "image/png",
    "etag": '"1419-8Bah04onM3AwXD6XNyn3luSplLE"',
    "mtime": "2025-12-01T17:49:02.153Z",
    "size": 5145,
    "path": "../public/assets/cv-sources/lfo-sine.png"
  },
  "/assets/cv-sources/lfo-square.png": {
    "type": "image/png",
    "etag": '"9ab-NYnD6OWeHPte5NtZGHHjBlhWPLY"',
    "mtime": "2025-12-01T17:49:02.153Z",
    "size": 2475,
    "path": "../public/assets/cv-sources/lfo-square.png"
  },
  "/assets/cv-sources/lfo-triangle.png": {
    "type": "image/png",
    "etag": '"fa5-l3WN/UPUn8qtI/WXKnkG8Y8p/Q4"',
    "mtime": "2025-12-01T17:49:02.154Z",
    "size": 4005,
    "path": "../public/assets/cv-sources/lfo-triangle.png"
  },
  "/assets/cv-sources/master-clock.png": {
    "type": "image/png",
    "etag": '"13dd-ULT+Sw0XZitDg1tesH3ujktSG8w"',
    "mtime": "2025-12-01T17:49:02.154Z",
    "size": 5085,
    "path": "../public/assets/cv-sources/master-clock.png"
  },
  "/assets/cv-sources/random-smooth.png": {
    "type": "image/png",
    "etag": '"1f0c-DsmYNa1li+IjQHuGjiXPz7VQu9k"',
    "mtime": "2025-12-01T17:49:02.155Z",
    "size": 7948,
    "path": "../public/assets/cv-sources/random-smooth.png"
  },
  "/assets/cv-sources/random-stepped.png": {
    "type": "image/png",
    "etag": '"bbb-6bAYfmdATL9XZxuWo3iwNUcAjmk"',
    "mtime": "2025-12-01T17:49:02.155Z",
    "size": 3003,
    "path": "../public/assets/cv-sources/random-stepped.png"
  },
  "/assets/cv-sources/seq-cv-gate.png": {
    "type": "image/png",
    "etag": '"21f4-Nc8r5W1eqfYdMpOaOiIP+8J8tIQ"',
    "mtime": "2025-12-01T17:49:02.156Z",
    "size": 8692,
    "path": "../public/assets/cv-sources/seq-cv-gate.png"
  },
  "/assets/cv-sources/touch-ctrl.png": {
    "type": "image/png",
    "etag": '"81b-ZUCQ7k7+HRfJvQz7OhLTZ67AlsY"',
    "mtime": "2025-12-01T17:49:02.156Z",
    "size": 2075,
    "path": "../public/assets/cv-sources/touch-ctrl.png"
  },
  "/assets/cv-sources/trigger-pattern-generator.png": {
    "type": "image/png",
    "etag": '"9a8-QQzUkXNESF+27r84gP1pBckjbPQ"',
    "mtime": "2025-12-01T17:49:02.156Z",
    "size": 2472,
    "path": "../public/assets/cv-sources/trigger-pattern-generator.png"
  },
  "/assets/cv-sources/voltage-slider.png": {
    "type": "image/png",
    "etag": '"dc8-l+A1crA6IluBqmvQxl36o+wqjVU"',
    "mtime": "2025-12-01T17:49:02.156Z",
    "size": 3528,
    "path": "../public/assets/cv-sources/voltage-slider.png"
  },
  "/assets/cv-modifiers/clock-divider.png": {
    "type": "image/png",
    "etag": '"1761-cb1MVM2MtRvhEb9xIj7j0SmrEOw"',
    "mtime": "2025-12-01T17:49:02.137Z",
    "size": 5985,
    "path": "../public/assets/cv-modifiers/clock-divider.png"
  },
  "/assets/cv-modifiers/clock-multiplier.png": {
    "type": "image/png",
    "etag": '"168b-EunxzTX4Dpju5RJFQAnP0LBMO3o"',
    "mtime": "2025-12-01T17:49:02.137Z",
    "size": 5771,
    "path": "../public/assets/cv-modifiers/clock-multiplier.png"
  },
  "/assets/cv-modifiers/comparator.png": {
    "type": "image/png",
    "etag": '"1c1a-e6GCYcKzCQW6KbhRinKZANd8Eo0"',
    "mtime": "2025-12-01T17:49:02.138Z",
    "size": 7194,
    "path": "../public/assets/cv-modifiers/comparator.png"
  },
  "/assets/cv-modifiers/cv-attenuator.png": {
    "type": "image/png",
    "etag": '"1d3b-oQp9vWdHw7c1Tta5gU9Qi91o+xs"',
    "mtime": "2025-12-01T17:49:02.140Z",
    "size": 7483,
    "path": "../public/assets/cv-modifiers/cv-attenuator.png"
  },
  "/assets/cv-modifiers/cv-attenuverter.png": {
    "type": "image/png",
    "etag": '"1d0d-eUuZVBa5MPHtPB+A8UfKljiDU9M"',
    "mtime": "2025-12-01T17:49:02.140Z",
    "size": 7437,
    "path": "../public/assets/cv-modifiers/cv-attenuverter.png"
  },
  "/assets/cv-modifiers/cv-inverter.png": {
    "type": "image/png",
    "etag": '"246b-3nUM87efFv8iQnX3mgNMY0qh0JU"',
    "mtime": "2025-12-01T17:49:02.140Z",
    "size": 9323,
    "path": "../public/assets/cv-modifiers/cv-inverter.png"
  },
  "/assets/cv-modifiers/cv-matrix-mixer.png": {
    "type": "image/png",
    "etag": '"1926-Sn1aTVqwaVMNxfyHiU4bsbKDzHg"',
    "mtime": "2025-12-01T17:49:02.141Z",
    "size": 6438,
    "path": "../public/assets/cv-modifiers/cv-matrix-mixer.png"
  },
  "/assets/cv-modifiers/cv-mixer-attenuverting.png": {
    "type": "image/png",
    "etag": '"25ed-tVqSrj+4KurZo3Ec5tLmnnAg8bU"',
    "mtime": "2025-12-01T17:49:02.141Z",
    "size": 9709,
    "path": "../public/assets/cv-modifiers/cv-mixer-attenuverting.png"
  },
  "/assets/cv-modifiers/cv-mixer.png": {
    "type": "image/png",
    "etag": '"1506-CO3tDFhoP5zGd33LpywiGX8BiPY"',
    "mtime": "2025-12-01T17:49:02.141Z",
    "size": 5382,
    "path": "../public/assets/cv-modifiers/cv-mixer.png"
  },
  "/assets/cv-modifiers/cv-mod-generic.png": {
    "type": "image/png",
    "etag": '"1123-xq4iBmEIgc9CzasLarzQNFs8LbA"',
    "mtime": "2025-12-01T17:49:02.142Z",
    "size": 4387,
    "path": "../public/assets/cv-modifiers/cv-mod-generic.png"
  },
  "/assets/cv-modifiers/cv-rectifier-full.png": {
    "type": "image/png",
    "etag": '"2083-1iESJsSF+4FvywBIfWbpwzpqUj4"',
    "mtime": "2025-12-01T17:49:02.142Z",
    "size": 8323,
    "path": "../public/assets/cv-modifiers/cv-rectifier-full.png"
  },
  "/assets/cv-modifiers/cv-rectifier-half.png": {
    "type": "image/png",
    "etag": '"1d41-KH8bsQ56pUXoCyt09cBH/AA70o0"',
    "mtime": "2025-12-01T17:49:02.142Z",
    "size": 7489,
    "path": "../public/assets/cv-modifiers/cv-rectifier-half.png"
  },
  "/assets/cv-modifiers/cv-switch.png": {
    "type": "image/png",
    "etag": '"1755-G9UVpf2ShMBItMZ1As0okMuJfSI"',
    "mtime": "2025-12-01T17:49:02.143Z",
    "size": 5973,
    "path": "../public/assets/cv-modifiers/cv-switch.png"
  },
  "/assets/cv-modifiers/cv-utility-mixer.png": {
    "type": "image/png",
    "etag": '"219a-C8SFksD8zzIt9wg7KWUDTpi1o8s"',
    "mtime": "2025-12-01T17:49:02.143Z",
    "size": 8602,
    "path": "../public/assets/cv-modifiers/cv-utility-mixer.png"
  },
  "/assets/cv-modifiers/gate-delay.png": {
    "type": "image/png",
    "etag": '"1713-EgsTAtAs27roB9c3k162XHJtFRA"',
    "mtime": "2025-12-01T17:49:02.143Z",
    "size": 5907,
    "path": "../public/assets/cv-modifiers/gate-delay.png"
  },
  "/assets/cv-modifiers/logic-and.png": {
    "type": "image/png",
    "etag": '"2483-KTeRE13KJyo11BzlaDwdYBilsjs"',
    "mtime": "2025-12-01T17:49:02.143Z",
    "size": 9347,
    "path": "../public/assets/cv-modifiers/logic-and.png"
  },
  "/assets/cv-modifiers/logic-nand.png": {
    "type": "image/png",
    "etag": '"26d3-NmrZzFXRSmG66LE4qevJLOavVFc"',
    "mtime": "2025-12-01T17:49:02.143Z",
    "size": 9939,
    "path": "../public/assets/cv-modifiers/logic-nand.png"
  },
  "/assets/cv-modifiers/logic-nor.png": {
    "type": "image/png",
    "etag": '"29ab-PdspJOkanub/eQfCrOJ8BYXHSUg"',
    "mtime": "2025-12-01T17:49:02.144Z",
    "size": 10667,
    "path": "../public/assets/cv-modifiers/logic-nor.png"
  },
  "/assets/cv-modifiers/logic-not.png": {
    "type": "image/png",
    "etag": '"21d5-T0PW5CbrHNAqjvWlmAnG4ijU2xQ"',
    "mtime": "2025-12-01T17:49:02.144Z",
    "size": 8661,
    "path": "../public/assets/cv-modifiers/logic-not.png"
  },
  "/assets/cv-modifiers/logic-or.png": {
    "type": "image/png",
    "etag": '"26a1-std5GR70kLXqgZ6xigFxc77QQg4"',
    "mtime": "2025-12-01T17:49:02.144Z",
    "size": 9889,
    "path": "../public/assets/cv-modifiers/logic-or.png"
  },
  "/assets/cv-modifiers/logic-xnor.png": {
    "type": "image/png",
    "etag": '"2db5-GpY7r8/0j876Sq1TJ7SGjKYt500"',
    "mtime": "2025-12-01T17:49:02.144Z",
    "size": 11701,
    "path": "../public/assets/cv-modifiers/logic-xnor.png"
  },
  "/assets/cv-modifiers/logic-xor.png": {
    "type": "image/png",
    "etag": '"2b24-JEcaI/wvejjSFf0IN5jTWWvHNUc"',
    "mtime": "2025-12-01T17:49:02.145Z",
    "size": 11044,
    "path": "../public/assets/cv-modifiers/logic-xor.png"
  },
  "/assets/cv-modifiers/precision-adder.png": {
    "type": "image/png",
    "etag": '"19f9-ovfFjS9fHn7ucTrFH7+wUrpFlho"',
    "mtime": "2025-12-01T17:49:02.145Z",
    "size": 6649,
    "path": "../public/assets/cv-modifiers/precision-adder.png"
  },
  "/assets/cv-modifiers/quantizer.png": {
    "type": "image/png",
    "etag": '"2139-ecto8fcMZcNd9YwjQxpbSEdYCFE"',
    "mtime": "2025-12-01T17:49:02.145Z",
    "size": 8505,
    "path": "../public/assets/cv-modifiers/quantizer.png"
  },
  "/assets/cv-modifiers/sample-and-hold.png": {
    "type": "image/png",
    "etag": '"23c9-0XiDAeifolBT19sUvYBJOui6qXk"',
    "mtime": "2025-12-01T17:49:02.145Z",
    "size": 9161,
    "path": "../public/assets/cv-modifiers/sample-and-hold.png"
  },
  "/assets/cv-modifiers/slew-limiter.png": {
    "type": "image/png",
    "etag": '"39eb-8X1PzehnTfILggg0xWt16uwtWnw"',
    "mtime": "2025-12-01T17:49:02.146Z",
    "size": 14827,
    "path": "../public/assets/cv-modifiers/slew-limiter.png"
  },
  "/assets/cv-modifiers/vca-dc.png": {
    "type": "image/png",
    "etag": '"13c2-RGfm5tbQZPX2XQfmECFzD7f8Vps"',
    "mtime": "2025-12-01T17:49:02.146Z",
    "size": 5058,
    "path": "../public/assets/cv-modifiers/vca-dc.png"
  }
};
function readAsset(id) {
  const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
  return promises.readFile(resolve(serverDir, assets[id].path));
}
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
  if (assets[id]) {
    return true;
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) {
      return true;
    }
  }
  return false;
}
function getAsset(id) {
  return assets[id];
}
const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = {
  gzip: ".gz",
  br: ".br"
};
const _mC7lxO = defineHandler((event) => {
  if (event.req.method && !METHODS.has(event.req.method)) {
    return;
  }
  let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
  let asset;
  const encodingHeader = event.req.headers.get("accept-encoding") || "";
  const encodings = [...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
  if (encodings.length > 1) {
    event.res.headers.append("Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      event.res.headers.delete("Cache-Control");
      throw new HTTPError({ status: 404 });
    }
    return;
  }
  const ifNotMatch = event.req.headers.get("if-none-match") === asset.etag;
  if (ifNotMatch) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  const ifModifiedSinceH = event.req.headers.get("if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  if (asset.type) {
    event.res.headers.set("Content-Type", asset.type);
  }
  if (asset.etag && !event.res.headers.has("ETag")) {
    event.res.headers.set("ETag", asset.etag);
  }
  if (asset.mtime && !event.res.headers.has("Last-Modified")) {
    event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !event.res.headers.has("Content-Encoding")) {
    event.res.headers.set("Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !event.res.headers.has("Content-Length")) {
    event.res.headers.set("Content-Length", asset.size.toString());
  }
  return readAsset(id);
});
const findRouteRules = /* @__PURE__ */ (() => {
  const $0 = [{ name: "headers", route: "/assets/**", handler: headers, options: { "cache-control": "public, max-age=31536000, immutable" } }];
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    let s = p.split("/");
    s.length - 1;
    if (s[1] === "assets") {
      r.unshift({ data: $0, params: { "_": s.slice(2).join("/") } });
    }
    return r;
  };
})();
const _lazy_My0jYJ = defineLazyEventHandler(() => Promise.resolve().then(function() {
  return ssrRenderer$1;
}));
const findRoute = /* @__PURE__ */ (() => {
  const data = { route: "/**", handler: _lazy_My0jYJ };
  return ((_m, p) => {
    return { data, params: { "_": p.slice(1) } };
  });
})();
const globalMiddleware = [
  toEventHandler(_mC7lxO)
].filter(Boolean);
function useNitroApp() {
  return useNitroApp.__instance__ ??= initNitroApp();
}
function initNitroApp() {
  const nitroApp2 = createNitroApp();
  globalThis.__nitro__ = nitroApp2;
  return nitroApp2;
}
function createNitroApp() {
  const hooks = void 0;
  const captureError = (error, errorCtx) => {
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) {
        errors.push({
          error,
          context: errorCtx
        });
      }
    }
  };
  const h3App = createH3App({ onError(error, event) {
    return errorHandler(error, event);
  } });
  let appHandler = (req) => {
    req.context ||= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    return h3App.fetch(req);
  };
  const app = {
    fetch: appHandler,
    h3: h3App,
    hooks,
    captureError
  };
  return app;
}
function createH3App(config) {
  const h3App = new H3Core(config);
  h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
  h3App["~middleware"].push(...globalMiddleware);
  {
    h3App["~getMiddleware"] = (event, route) => {
      const pathname = event.url.pathname;
      const method = event.req.method;
      const middleware = [];
      {
        const routeRules = getRouteRules(method, pathname);
        event.context.routeRules = routeRules?.routeRules;
        if (routeRules?.routeRuleMiddleware.length) {
          middleware.push(...routeRules.routeRuleMiddleware);
        }
      }
      middleware.push(...h3App["~middleware"]);
      if (route?.data?.middleware?.length) {
        middleware.push(...route.data.middleware);
      }
      return middleware;
    };
  }
  return h3App;
}
function getRouteRules(method, pathname) {
  const m = findRouteRules(method, pathname);
  if (!m?.length) {
    return { routeRuleMiddleware: [] };
  }
  const routeRules = {};
  for (const layer of m) {
    for (const rule of layer.data) {
      const currentRule = routeRules[rule.name];
      if (currentRule) {
        if (rule.options === false) {
          delete routeRules[rule.name];
          continue;
        }
        if (typeof currentRule.options === "object" && typeof rule.options === "object") {
          currentRule.options = {
            ...currentRule.options,
            ...rule.options
          };
        } else {
          currentRule.options = rule.options;
        }
        currentRule.route = rule.route;
        currentRule.params = {
          ...currentRule.params,
          ...layer.params
        };
      } else if (rule.options !== false) {
        routeRules[rule.name] = {
          ...rule,
          params: layer.params
        };
      }
    }
  }
  const middleware = [];
  for (const rule of Object.values(routeRules)) {
    if (rule.options === false || !rule.handler) {
      continue;
    }
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}
function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
  process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
  process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
const port = Number.parseInt(process.env.NITRO_PORT || process.env.PORT || "") || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
serve({
  port,
  hostname: host,
  tls: cert && key ? {
    cert,
    key
  } : void 0,
  fetch: nitroApp.fetch
});
trapUnhandledErrors();
const nodeServer = {};
function fetchViteEnv(viteEnvName, input, init) {
  const envs = globalThis.__nitro_vite_envs__ || {};
  const viteEnv = envs[viteEnvName];
  if (!viteEnv) {
    throw HTTPError.status(404);
  }
  return Promise.resolve(viteEnv.fetch(toRequest(input, init)));
}
function ssrRenderer({ req }) {
  return fetchViteEnv("ssr", req);
}
const ssrRenderer$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: ssrRenderer
});
export {
  NullProtoObj as N,
  nodeServer as default
};
