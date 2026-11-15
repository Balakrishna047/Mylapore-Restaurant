# Gap Register: Mylapore Express v2.7

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Executive Summary

This register formally logs all architectural, code, schema, and integration items identified during the repository audit and full-stack implementation of **Mylapore Express v2.7**. 

Every item is tracked with its status, impact level, resolution strategy, and verification evidence.

---

## 2. Master Gap Tracking Matrix

| Gap ID | Component / Layer | Description | Status | Severity | Resolution & Verification Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-001** | Frontend | Monolithic `ChatWidget.tsx` containing message list, input form, and modals | **RESOLVED** | Medium | Extracted `ChatMessageList.tsx`, `ChatInput.tsx`, `WelcomeScreen.tsx`, and `MenuItemDetail.tsx`. Verified with clean `next build`. |
| **GAP-002** | Backend (`ChatModule`) | Turn response omitted explicit `executionMode` attribute | **RESOLVED** | Low | Updated `ChatService.executeTurn` and `processTurnIntent` to return `executionMode: 'AGENTFORCE' \| 'SIMPLE_MENU'`. Verified in unit tests. |
| **GAP-003** | Backend / SF Integration | Dual org confusion (Trailhead OrgFarm domain expired vs Developer Org CAN96) | **RESOLVED** | High | Standardized on active Developer Org CAN96 (`00DgK00000fMxxtUAC`), Agent ID `0XxgK000002YIJ7SAO` (Version 4). Headless Agent API routing active. |
| **GAP-004** | API / Agent Gateway | Root endpoint `GET /api/v1/menu` returned 404 for legacy Apex callouts expecting `/menu` rather than `/menu/items` | **RESOLVED** | Medium | Added root `@Get()` mapping in `MenuController` and updated `MylaporeBrowseMenuAction.cls`. Tested with `HTTP 200` returning 5 dishes. |
| **GAP-005** | API Spec (`API_SPEC.yaml`) | OpenAPI specification was missing `/chat/session`, `/chat/turn`, and `/agent/*` path declarations | **RESOLVED** | Low | Updated `docs/API_SPEC.yaml` with complete path schemas, request bodies, and error response codes. |
| **GAP-006** | Scope Discipline | Prohibited features (Cart/Checkout/Orders inside chat concierge) | **FROZEN (COMPLIANT)** | High | Strictly frozen out of Release 1. Concierge handles discovery actions only (`listMenuCategories`, `searchMenu`, `getMenuItemDetails`). |
| **GAP-007** | Database Migrations | Risk of destructive migrations altering existing seed data | **PRESERVED (COMPLIANT)** | Critical | Database schema validated against Neon PostgreSQL. `ChatSession`, `ChatTurn`, and `ChatDisplayBlock` models preserved without destructive changes. |
| **GAP-008** | Turn Mutex & Lock | Potential for concurrent turns causing race conditions or duplicate agent costs | **RESOLVED** | High | Implemented `SessionLockGuard` enforcing HTTP 423 Session Busy Lock. Tested and verified. |
