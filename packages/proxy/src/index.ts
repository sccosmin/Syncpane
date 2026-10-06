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
  });

  const syncScript = `
    const socket = io();
    let isSyncing = false;

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
