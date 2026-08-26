const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 8124);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};
// scrub-engine.js fetches whole clips as blobs, so an uncacheable video response
// means every reload re-downloads several MB before scrubbing can start smoothly.
// Binary assets here are content, not markup, so they're safe to cache hard;
// html/js/css keep the old no-cache behaviour so local edits show up on refresh.
const immutableExts = new Set([".mp4", ".png", ".jpg", ".jpeg", ".webp", ".svg"]);

http
  .createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const requested = pathname === "/" ? "/index.html" : pathname;
    const filePath = path.resolve(root, `.${requested}`);

    if (!filePath.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        response.writeHead(404).end("Not found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = types[ext] || "application/octet-stream";
      const cacheControl = immutableExts.has(ext) ? "public, max-age=31536000, immutable" : "no-cache";
      const etag = `"${stats.size}-${stats.mtimeMs}"`;
      const lastModified = stats.mtime.toUTCString();

      if (request.headers["if-none-match"] === etag || request.headers["if-modified-since"] === lastModified) {
        response.writeHead(304, { "Cache-Control": cacheControl, ETag: etag, "Last-Modified": lastModified }).end();
        return;
      }

      const range = request.headers.range;

      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) {
          response.writeHead(416, { "Content-Range": `bytes */${stats.size}` }).end();
          return;
        }

        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Math.min(Number(match[2]), stats.size - 1) : stats.size - 1;
        if (start > end || start >= stats.size) {
          response.writeHead(416, { "Content-Range": `bytes */${stats.size}` }).end();
          return;
        }

        response.writeHead(206, {
          "Accept-Ranges": "bytes",
          "Cache-Control": cacheControl,
          ETag: etag,
          "Last-Modified": lastModified,
          "Content-Length": end - start + 1,
          "Content-Range": `bytes ${start}-${end}/${stats.size}`,
          "Content-Type": contentType
        });
        fs.createReadStream(filePath, { start, end }).pipe(response);
        return;
      }

      response.writeHead(200, {
        "Accept-Ranges": "bytes",
        "Cache-Control": cacheControl,
        ETag: etag,
        "Last-Modified": lastModified,
        "Content-Length": stats.size,
        "Content-Type": contentType
      });
      fs.createReadStream(filePath).pipe(response);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Preview running at http://127.0.0.1:${port}/`);
  });
