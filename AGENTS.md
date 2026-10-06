---
trigger: always_on
description: "Core project state and architectural context for Syncpane. Always read this to understand the current phase and tech stack."
---

# Syncpane State

- **Project Name:** Syncpane
- **Scope:** A lightweight, OSS CLI tool for responsive web design testing (multi-viewport synchronizer) tailored for local development.
- **Architecture:** NPM Workspaces monorepo.
  - `@syncpane/cli` (Node, Commander)
  - `@syncpane/proxy` (Fastify, http-proxy, socket.io)
  - `@syncpane/ui` (Vue 3, Tailwind, socket.io-client)
- **Current State:** Phase 4 - Scroll Synchronization engine implemented. WebSocket server broadcasts scroll percentages, `/__syncpane.js` client script served and dynamically injected into proxied HTML responses, anti-framing headers stripped, and accept-encoding removed. The project is now under Git source control and we are preparing for Phase 5 (Click & Navigation Sync).
- **Agent Instructions:** CRITICAL: You are operating within Google Antigravity. Before starting any task, review the Current State section below. At the end of every successful task, update the 'Current State' section of this file to reflect the latest progress so the next agent session has the correct context.

