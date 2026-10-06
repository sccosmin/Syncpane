import Fastify, { FastifyInstance, FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import cors from "@fastify/cors";
import proxy from "@fastify/http-proxy";
import { Server as SocketIOServer } from "socket.io";

export async function startProxy(targetUrl: string, port: number): Promise<void> {
  const parsedTarget = new URL(targetUrl);
  const upstreamOrigin = parsedTarget.origin;
  const initialPath = parsedTarget.pathname && parsedTarget.pathname !== "/"
    ? `${parsedTarget.pathname}${parsedTarget.search}`
    : null;

  const server: FastifyInstance = Fastify({ logger: false });

  await server.register(cors, {
    origin: true,
  });

  const io = new SocketIOServer(server.server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("sync-scroll", (data: unknown) => {
      socket.broadcast.emit("sync-scroll", data);
    });

    socket.on("sync-navigate", (data) => socket.broadcast.emit("sync-navigate", data));

    socket.on("sync-input", (data) => socket.broadcast.emit("sync-input", data));

    socket.on("sync-generic-click", (data) => socket.broadcast.emit("sync-generic-click", data));
  });

  const syncScript = `
    const socket = io();
    let isSyncing = false;
    let isSyncingInput = false;
    let isSyncingClick = false;
    let clickTimeout = null;

    window.addEventListener('scroll', () => {
      if (!isSyncing) {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const percentY = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        socket.emit('sync-scroll', { percentY });
      }
    });

    socket.on('sync-scroll', (data) => {
      isSyncing = true;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      window.scrollTo(0, data.percentY * maxScroll);
      setTimeout(() => {
        isSyncing = false;
      }, 50);
    });

    function getElementSelector(el) {
      if (!el || !(el instanceof Element)) return null;
      const path = [];
      let current = el;

      while (current && current.nodeType === Node.ELEMENT_NODE) {
        const tagName = current.tagName.toLowerCase();
        if (tagName === 'body' || tagName === 'html') {
          path.unshift(tagName);
          break;
        }

        if (current.id) {
          const escapedId = (window.CSS && CSS.escape) ? CSS.escape(current.id) : current.id;
          try {
            if (document.querySelectorAll('#' + escapedId).length === 1) {
              path.unshift('#' + escapedId);
              break;
            }
          } catch (err) {}
        }

        const parent = current.parentElement;
        if (!parent) {
          path.unshift(tagName);
          break;
        }

        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(current) + 1;
        path.unshift(tagName + ':nth-child(' + index + ')');
        current = parent;
      }

      return path.join(' > ');
    }

    function getElementPathIndices(el) {
      const indices = [];
      let current = el;
      while (current && current !== document.body && current.parentElement) {
        const parent = current.parentElement;
        const index = Array.prototype.indexOf.call(parent.children, current);
        if (index === -1) break;
        indices.unshift(index);
        current = parent;
      }
      return indices;
    }

    const isFormValueControl = (el) => {
      if (!el || !el.matches) return false;
      if (el.matches('input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select')) return true;
      const label = el.closest('label');
      if (label) {
        const control = label.control || label.querySelector('input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select');
        if (control) return true;
      }
      return false;
    };

    document.addEventListener('click', (e) => {
      if (isSyncingClick || isSyncingInput) return;

      const a = e.target.closest('a');
      if (a && a.href) {
        e.preventDefault();
        socket.emit('sync-navigate', { href: a.href });
        return;
      }

      if (isFormValueControl(e.target)) return;

      const clickable = (e.target.closest && e.target.closest('button, [role="button"]')) || e.target;
      const target = clickable;
      if (!target || !(target instanceof Element)) return;

      const selector = getElementSelector(target);
      const pathIndices = getElementPathIndices(target);

      if (selector) {
        socket.emit('sync-generic-click', {
          selector,
          pathIndices
        });
      }
    }, true);

    socket.on('sync-navigate', (data) => {
      window.location.href = data.href;
    });

    socket.on('sync-generic-click', (data) => {
      isSyncingClick = true;
      if (clickTimeout) clearTimeout(clickTimeout);
      try {
        let target = null;
        if (data.selector) {
          try {
            target = document.querySelector(data.selector);
          } catch (err) {}
        }
        if (!target && Array.isArray(data.pathIndices) && data.pathIndices.length > 0) {
          let current = document.body;
          for (let i = 0; i < data.pathIndices.length; i++) {
            const idx = data.pathIndices[i];
            if (current && current.children && current.children[idx]) {
              current = current.children[idx];
            } else {
              current = null;
              break;
            }
          }
          target = current;
        }

        if (target) {
          const btn = (target.closest && target.closest('button, [role="button"]')) || target;
          if (typeof btn.click === 'function') {
            btn.click();
          } else {
            btn.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              detail: 1
            }));
          }
        }
      } catch (err) {
        console.error('[Syncpane] Error syncing generic click:', err);
      }
      clickTimeout = setTimeout(() => {
        isSyncingClick = false;
        clickTimeout = null;
      }, 50);
    });

    const handleFormInput = (e) => {
      if (isSyncingInput || isSyncingClick) return;
      const target = e.target;
      if (!target || !target.matches || !target.matches('input, textarea, select')) return;

      const elements = Array.from(document.querySelectorAll('input, textarea, select'));
      const index = elements.indexOf(target);
      if (index === -1) return;

      socket.emit('sync-input', {
        index,
        type: target.type || null,
        value: target.value,
        checked: target.checked
      });
    };

    document.addEventListener('input', handleFormInput, true);
    document.addEventListener('change', handleFormInput, true);

    socket.on('sync-input', (data) => {
      isSyncingInput = true;
      try {
        const elements = Array.from(document.querySelectorAll('input, textarea, select'));
        const target = elements[data.index];
        if (target) {
          if (target.type === 'checkbox' || target.type === 'radio') {
            const proto = Object.getPrototypeOf(target);
            const desc = Object.getOwnPropertyDescriptor(proto, 'checked');
            if (desc && desc.set) {
              desc.set.call(target, data.checked);
            } else {
              target.checked = data.checked;
            }
          } else {
            const proto = Object.getPrototypeOf(target);
            const desc = Object.getOwnPropertyDescriptor(proto, 'value');
            if (desc && desc.set) {
              desc.set.call(target, data.value);
            } else {
              target.value = data.value;
            }
          }
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } catch (err) {
        console.error('[Syncpane] Error syncing input:', err);
      }
      setTimeout(() => {
        isSyncingInput = false;
      }, 50);
    });
  `;

  server.get("/__syncpane.js", (_request: FastifyRequest, reply: FastifyReply) => {
    reply.header("content-type", "application/javascript");
    reply.send(syncScript);
  });

  await server.register(proxy, {
    upstream: upstreamOrigin,
    httpMethods: ["DELETE", "GET", "HEAD", "PATCH", "POST", "PUT"],
    preHandler: [
      (req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
        if (initialPath && req.method === "GET" && (req.url === "/" || req.url === "")) {
          reply.redirect(initialPath);
          return;
        }
        delete req.headers["accept-encoding"];
        done();
      },
    ] as any,
    replyOptions: {
      onResponse: (_request, reply, res) => {
        reply.removeHeader("x-frame-options");
        reply.removeHeader("content-security-policy");
        reply.removeHeader("X-Frame-Options");
        reply.removeHeader("Content-Security-Policy");

        const rawHeaders = (res as any).headers || (res.stream as any)?.headers || {};
        const rawContentType = rawHeaders["content-type"];
        const contentType = Array.isArray(rawContentType)
          ? rawContentType.join(";")
          : (typeof rawContentType === "string" ? rawContentType : "");

        if (contentType.includes("text/html")) {
          const chunks: Buffer[] = [];
          res.stream.on("data", (chunk: unknown) => {
            if (Buffer.isBuffer(chunk)) {
              chunks.push(chunk);
            } else if (typeof chunk === "string") {
              chunks.push(Buffer.from(chunk));
            } else {
              chunks.push(Buffer.from(chunk as any));
            }
          });

          res.stream.on("end", () => {
            const html = Buffer.concat(chunks).toString("utf-8");
            const injectedTags =
              '<script src="/socket.io/socket.io.js"></script><script src="/__syncpane.js"></script>';
            const modifiedHtml = html.includes("</body>")
              ? html.replace("</body>", `${injectedTags}</body>`)
              : `${html}${injectedTags}`;

            reply.removeHeader("content-length");
            reply.send(modifiedHtml);
          });

          res.stream.on("error", (err) => {
            reply.send(err);
          });
        } else {
          reply.send(res.stream);
        }
      },
    },
  });

  try {
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`Proxy active on http://localhost:${port}`);
    if (initialPath) {
      console.log(`Target path: ${initialPath} (root / redirects to ${initialPath})`);
    }
  } catch (err) {
    server.log.error(err);
    throw err;
  }
}
