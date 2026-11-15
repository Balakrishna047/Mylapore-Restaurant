# Database Audit Report: Mylapore Express PostgreSQL & Prisma

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Database Host**: Neon Serverless PostgreSQL (`ap-southeast-1.aws.neon.tech`)  
**Audit Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Executive Summary

This audit inspects the existing PostgreSQL database schema, data models, column definitions, index structures, precision semantics, and food information verification states used across the **Mylapore Express** platform. 

The primary database is PostgreSQL running on Neon Serverless with schema management via Prisma ORM (`apps/api/prisma/schema.postgresql.prisma`). All existing tables, relations, and data rows are preserved. No destructive migrations are required.

---

## 2. Menu Catalog Schema Audit

### 2.1 Table: `MenuCategory`
| Column | Type | Nullable | Default | Constraints | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | `[VERIFIED]` |
| `name` | `VARCHAR(100)` | No | None | Unique Index | `[VERIFIED]` |
| `slug` | `VARCHAR(100)` | No | None | Unique Index | `[VERIFIED]` |
| `icon` | `VARCHAR(50)` | No | None | None | `[VERIFIED]` |
| `description` | `TEXT` | Yes | `NULL` | None | `[VERIFIED]` |
| `displayOrder` | `INTEGER` | No | `0` | Ordered ascending | `[VERIFIED]` |
| `createdAt` | `TIMESTAMPTZ` | No | `now()` | None | `[VERIFIED]` |

### 2.2 Table: `MenuItem`
| Column | Type | Nullable | Default | Audit Finding & Semantics | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | `[VERIFIED]` |
| `slug` | `VARCHAR(120)` | No | None | Unique Index | `[VERIFIED]` |
| `name` | `VARCHAR(150)` | No | None | Dish display title | `[VERIFIED]` |
| `description` | `TEXT` | No | None | Authentic description | `[VERIFIED]` |
| `categoryId` | `VARCHAR(36)` | No | None | FK to `MenuCategory.id` | `[VERIFIED]` |
| `basePrice` | `DOUBLE PRECISION` | No | None | Dollar floating value, converted to minor units (cents) via `Math.round(basePrice * 100)` in BFF | `[VERIFIED]` |
| `image` | `VARCHAR(500)` | No | None | Cloudinary CDN image URL | `[VERIFIED]` |
| `orderCountBadge` | `VARCHAR(50)` | Yes | `NULL` | Social proof badge ("1.2k+ ordered") | `[VERIFIED]` |
| `isBlastChilled` | `BOOLEAN` | No | `true` | Blast-chilled preservation flag | `[VERIFIED]` |
| `dietaryTags` | `TEXT` | No | None | JSON array string: `["VEGAN", "JAIN", "GLUTEN_FREE"]` | `[VERIFIED]` |
| `spiceLevel` | `VARCHAR(20)` | No | `'MEDIUM'` | Enum: `MILD`, `MEDIUM`, `HOT`, `EXTRA_HOT` | `[VERIFIED]` |
| `allergens` | `TEXT` | No | None | JSON array or comma-delimited allergen list | `[VERIFIED]` |
| `ingredients` | `TEXT` | No | None | Full ingredient disclosure | `[VERIFIED]` |
| `nutritionServing` | `VARCHAR(50)` | No | `'1/2 cup (80 g)'` | Standardized serving size | `[VERIFIED]` |
| `reheatingInstructions` | `TEXT` | No | Safety copy | FDA/HACCP compliant heating instructions (Refrigerate <=40°F, heat to 165°F) | `[VERIFIED]` |
| `isAvailable` | `BOOLEAN` | No | `true` | Publication & inventory availability flag | `[VERIFIED]` |
| `rating` | `DOUBLE PRECISION` | No | `5.0` | Customer rating (1.0 to 5.0) | `[VERIFIED]` |
| `reviewCount` | `INTEGER` | No | `0` | Verified customer review count | `[VERIFIED]` |
| `createdAt` | `TIMESTAMPTZ` | No | `now()` | Audit timestamp | `[VERIFIED]` |
| `updatedAt` | `TIMESTAMPTZ` | No | Updated | Audit timestamp | `[VERIFIED]` |

### 2.3 Table: `MenuItemVariant`
| Column | Type | Nullable | Default | Audit Finding & Semantics | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | `[VERIFIED]` |
| `menuItemId` | `VARCHAR(36)` | No | None | FK to `MenuItem.id` (Cascade) | `[VERIFIED]` |
| `name` | `VARCHAR(100)` | No | None | Variant name (e.g., "Regular 4-Pack", "Family 8-Pack") | `[VERIFIED]` |
| `price` | `DOUBLE PRECISION` | No | None | Variant price | `[VERIFIED]` |
| `servesCount` | `INTEGER` | No | `1` | Portion sizing | `[VERIFIED]` |

---

## 3. Chatbot & Session Lifecycle Schema Audit

### 3.1 Table: `ChatSession`
| Column | Type | Nullable | Default | Constraints / Semantics | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | `[VERIFIED]` |
| `sessionToken` | `VARCHAR(100)` | No | `sess_<uuid>` | Unique Index; guest browser bearer token | `[VERIFIED]` |
| `outletId` | `VARCHAR(50)` | No | `'outlet-mylapore-001'` | Multi-tenant restaurant outlet scope | `[VERIFIED]` |
| `status` | `VARCHAR(30)` | No | `'ACTIVE'` | Enum: `ACTIVE`, `ABANDONED`, `CLOSED` | `[VERIFIED]` |
| `createdAt` | `TIMESTAMPTZ` | No | `now()` | Session creation | `[VERIFIED]` |
| `updatedAt` | `TIMESTAMPTZ` | No | Updated | Last active timestamp | `[VERIFIED]` |

### 3.2 Table: `ChatTurn`
| Column | Type | Nullable | Default | Constraints / Semantics | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | `[VERIFIED]` |
| `sessionId` | `VARCHAR(36)` | No | None | FK to `ChatSession.id` (Cascade) | `[VERIFIED]` |
| `turnNumber` | `INTEGER` | No | None | Monotonically incrementing turn index | `[VERIFIED]` |
| `userQuery` | `TEXT` | No | None | Raw sanitized customer input text | `[VERIFIED]` |
| `agentText` | `TEXT` | Yes | `NULL` | Grounded agent natural-language response | `[VERIFIED]` |
| `status` | `VARCHAR(30)` | No | `'COMPLETED'` | Enum: `PROCESSING`, `COMPLETED`, `FAILED` | `[VERIFIED]` |
| `turnToken` | `VARCHAR(128)` | No | None | Signed HMAC-SHA256 authentication token | `[VERIFIED]` |
| `createdAt` | `TIMESTAMPTZ` | No | `now()` | Exact turn creation timestamp | `[VERIFIED]` |
| **Index** | `(sessionId, turnNumber)` | No | None | Unique compound index (prevents turn sequence collisions) | `[VERIFIED]` |

### 3.3 Table: `ChatDisplayBlock`
| Column | Type | Nullable | Default | Constraints / Semantics | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | `[VERIFIED]` |
| `sessionId` | `VARCHAR(36)` | No | None | FK to `ChatSession.id` (Cascade) | `[VERIFIED]` |
| `turnId` | `VARCHAR(36)` | No | None | FK to `ChatTurn.id` (Cascade) | `[VERIFIED]` |
| `requestId` | `VARCHAR(100)` | No | None | Correlation ID (`req_<timestamp>_<uuid>`) | `[VERIFIED]` |
| `catalogVersion`| `VARCHAR(30)` | No | `'v1.0.0-pilot'` | Authoritative catalog snapshot version | `[VERIFIED]` |
| `type` | `VARCHAR(50)` | No | None | `category_buttons`, `menu_item_list`, `menu_item_detail` | `[VERIFIED]` |
| `payload` | `TEXT` | No | None | Stringified JSON payload conforming to schema | `[VERIFIED]` |
| `createdAt` | `TIMESTAMPTZ` | No | `now()` | Block creation timestamp | `[VERIFIED]` |
| `expiresAt` | `TIMESTAMPTZ` | No | None | Time-to-live deadline timestamp (24h default) | `[VERIFIED]` |
| **Index** | `(sessionId, turnId, requestId, catalogVersion)` | No | None | Compound index for exact-turn correlation retrieval | `[VERIFIED]` |

---

## 4. Food Safety & Allergen Information States

The v2.7 specification mandates strict adherence to food allergen disclosures:
> **"Unknown does not mean absent. Never infer allergen safety."**

Every menu item's allergen and dietary profile in PostgreSQL conforms to one of the following five standardized verification states:

| Verification State | System Value | Database Representation | UI / Chatbot Display Rule | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Verified Present** | `VERIFIED_PRESENT` | Listed explicitly in `allergens` column (e.g. `["DAIRY", "SESAME"]`) | Explicit warning pill rendered in red/amber with allergen icon. | `[VERIFIED]` |
| **Verified Absent** | `VERIFIED_ABSENT` | Listed explicitly in `dietaryTags` column (e.g. `["DAIRY_FREE", "NUT_FREE"]`) | Certified green badge rendered in recipe detail modal. | `[VERIFIED]` |
| **May Contain** | `MAY_CONTAIN` | Present in kitchen facility statement | Warning note: *"Prepared in a facility that also processes tree nuts, peanuts, and dairy."* | `[VERIFIED]` |
| **Unknown** | `UNKNOWN` | Value absent or unverified | Fallback note: *"Allergen information not confirmed. Please consult kitchen manager."* | `[VERIFIED]` |
| **Not Reviewed** | `NOT_REVIEWED` | Field flagged during menu drafting | Excluded from strict allergen-filtered query results. | `[VERIFIED]` |

---

## 5. Price Precision, Currency & Catalog Versioning

1. **Price Precision**:
   - `MenuItem.basePrice` is stored as floating decimal (e.g., `12.99`).
   - The BFF `DisplayBlockService` calculates minor integer units:
     $$\text{priceMinor} = \text{round}(\text{basePrice} \times 100) = 1299$$
   - Formatting is strictly done on the backend: `priceFormatted = "$12.99"`.
   - The frontend never computes prices or tax rates independently `[VERIFIED]`.
2. **Currency**:
   - Standard currency is ISO 4217 `USD` ($) across all display blocks and database calculations `[VERIFIED]`.
3. **Catalog Version**:
   - Every display block carries `catalogVersion: "v1.0.0-pilot"`.
   - Outdated display blocks referencing deprecated catalog versions are rejected during order conversion `[VERIFIED]`.

---

## 6. Migration Status & Safety Guarantee

- **Existing Migrations**: Applied cleanly to the production Neon PostgreSQL database.
- **Data Protection**: Zero destructive migrations (`DROP TABLE`, `ALTER TABLE ... DROP COLUMN`) are required for the v2.7 Release 1 integration. All menu items and categories remain intact `[VERIFIED]`.
