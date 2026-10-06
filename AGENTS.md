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
- **Current State:** Phase 5 (Full Synchronization Engine) is 100% complete. All core synchronization modalities are implemented and verified:
  1. **Scroll Synchronization:** Percentage-based relative Y-scroll synchronization with `isSyncing` anti-echo lock.
  2. **Navigation Synchronization:** Global interception of `<a>` tag navigations with URL broadcasting and peer redirection via `sync-navigate`.
  3. **Form Input Synchronization:** Interception of `input` and `change` events on `input`, `textarea`, and `select` elements with DOM index mapping, synthetic bubbling event dispatch for framework reactivity (Vue/React), and `isSyncingInput` anti-echo lock.
  4. **Generic UI Click Synchronization:** Interception of generic clicks (`<button>`, `<div role="button">`, hamburger menus, modal toggles/overlays, accordions, tabs, counters) via capturing click listener, unique deterministic CSS selector path generation (`nth-child` and unique IDs) with fallback DOM path indices, synthetic click dispatch, `isSyncingClick` anti-echo lock, and cross-talk prevention with form controls. Broadcasted via `sync-generic-click` across Fastify/Socket.io.
- **Agent Instructions:** CRITICAL: You are operating within Google Antigravity. Before starting any task, review the Current State section below. At the end of every successful task, update the 'Current State' section of this file to reflect the latest progress so the next agent session has the correct context.

