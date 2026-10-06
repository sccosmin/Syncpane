# Syncpane

Syncpane is an open-source responsive web design testing tool that previews your web apps across multiple device viewports simultaneously.

---

## Architecture Overview

- **`packages/ui`**: Vue 3 + Tailwind dashboard rendering synchronized viewports.
- **`packages/proxy`**: Fastify-based HTTP proxy that strips frame-restriction headers so target applications can be embedded in dashboard `<iframe>`s.
- **`packages/cli`**: CLI command to spin up testing sessions and proxy target URLs.

---

## Known Limitations

### 1. Complex Public Websites with Client-Side Routing & Hardcoded Absolute URLs
Syncpane is primarily designed for **local development and staging environments** (e.g., `http://localhost:3000`, `http://localhost:5173`). 

When testing large, production public websites (such as `google.com`):
- **Hardcoded absolute URLs & Subdomain Redirects**: Production websites often issue absolute canonical redirects (e.g., `https://google.com` -> `https://www.google.com/`) or execute client-side scripts and forms pointing to explicit origin domains (`https://*.google.com/...`). Interacting with forms or links on those sites causes the browser's iframe to navigate away from the local proxy (`http://localhost:4000`) directly to the raw third-party domain, which re-enforces `X-Frame-Options` and `Content-Security-Policy` protections.
- **Cookie & SameSite / Anti-Bot Protections**: Many major public sites enforce strict cross-site cookie and bot-mitigation policies that break when served through an embedded iframe context.

> [!NOTE]
> **Recommended Usage**: Run Syncpane against your own local dev servers or controlled test environments (`localhost`, local IP, or custom staging domains) where internal links are relative and frame-embedding headers can be safely bypassed.

