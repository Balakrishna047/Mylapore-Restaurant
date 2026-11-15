# Display Block Schema Specification: Mylapore Express v2.7

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Executive Summary

Display blocks are server-issued, cryptographically signed, and schema-validated UI structures rendered by the client storefront (`apps/web`). The client operates strictly as a presentation-only renderer:
> **"The AI talks; the backend decides."**
> 
> *The AI agent never emits raw HTML, React code, or unstructured card JSON. The backend constructs typed display blocks with exact-turn correlation metadata, prices calculated in minor units, and verified food safety disclosures.*

---

## 2. Common Display Block Envelope

Every display block emitted by the backend conforms to the following mandatory envelope schema:

```json
{
  "schema_version": "2.7.0",
  "type": "category_buttons | menu_item_list | menu_item_detail",
  "session_id": "sess_8f3d1b9e-4a6c-4811-b3de-7c98e10b1092",
  "turn_id": "turn_0c982b14-81d3-48b2-a4f6-e32514ab3129",
  "request_id": "req_1763198400000_a1b2c3d4",
  "catalog_version": "v1.0.0-pilot",
  "created_at": "2026-11-15T10:00:00.000Z",
  "expires_at": "2026-11-16T10:00:00.000Z",
  "payload": {}
}
```

### Envelope Field Definitions:
| Field | Type | Description | Validation Rule |
| :--- | :--- | :--- | :--- |
| `schema_version` | `string` | Semantic contract version | Must strictly equal `"2.7.0"`. |
| `type` | `string` | Display block type identifier | Must be one of `category_buttons`, `menu_item_list`, `menu_item_detail`. |
| `session_id` | `string` | Unique guest session identifier | Must match active client `sessionToken`. |
| `turn_id` | `string` | UUID of the specific turn creating this block | Exact-turn correlation: client rejects blocks from older turns. |
| `request_id` | `string` | Monotonic request tracing ID | Format: `req_{timestamp}_{shortHash}`. |
| `catalog_version` | `string` | Version snapshot of PostgreSQL menu | Rejects stale blocks during order transitions. |
| `created_at` | `ISO 8601` | Timestamp of block issuance | Used for freshness calculations. |
| `expires_at` | `ISO 8601` | Expiration deadline timestamp | Blocks past `expires_at` (default 24h) cannot be interacted with. |
| `payload` | `object` | Type-specific validated data structure | Validated against type schema below. |

---

## 3. Approved Display Block Types

### 3.1 Type 1: `category_buttons`
Rendered during chat initialization and category discovery turns. Displays clickable pills representing published culinary categories.

#### Payload Schema:
```json
{
  "categories": [
    {
      "id": "cat-tiffin-001",
      "name": "Breakfast Tiffins",
      "slug": "breakfast-tiffins",
      "icon": "🥞",
      "itemCount": 4,
      "actionPayload": {
        "type": "FILTER_CATEGORY",
        "categorySlug": "breakfast-tiffins",
        "categoryName": "Breakfast Tiffins"
      }
    }
  ]
}
```

---

### 3.2 Type 2: `menu_item_list`
Rendered when searching dishes or exploring a specific category. Displays a horizontal carousel of high-fidelity menu cards.

#### Constraints:
- **Maximum Cards**: Strictly limited to **maximum 6 menu cards** per block to ensure instant rendering and eliminate cognitive overload.
- **Price Precision**: Includes both human-readable `priceFormatted` (`"$12.99"`) and integer `priceMinor` (`1299`) for zero-rounding discrepancies.

#### Payload Schema:
```json
{
  "items": [
    {
      "id": "item-idli-001",
      "slug": "kanchipuram-idli",
      "name": "Kanchipuram Idli (4 Pcs)",
      "description": "Steamed in traditional handwoven bamboo baskets with cumin, whole black pepper, and fresh curry leaves.",
      "imageUrl": "https://res.cloudinary.com/mylapore/image/upload/v1/dishes/kanchipuram-idli.jpg",
      "priceFormatted": "$12.99",
      "priceMinor": 1299,
      "currency": "USD",
      "categoryName": "Breakfast Tiffins",
      "dietaryTags": ["VEGAN", "JAIN", "GLUTEN_FREE"],
      "spiceLevel": "MILD",
      "isBlastChilled": true,
      "orderCountBadge": "1.2k+ ordered",
      "actionPayload": {
        "type": "VIEW_ITEM_DETAIL",
        "itemId": "item-idli-001",
        "itemSlug": "kanchipuram-idli"
      }
    }
  ],
  "count": 1
}
```

---

### 3.3 Type 3: `menu_item_detail`
Rendered when a customer clicks "View Details" on a dish card or explicitly requests ingredients/allergens. Opens the authentic recipe modal.

#### Payload Schema:
```json
{
  "id": "item-idli-001",
  "slug": "kanchipuram-idli",
  "name": "Kanchipuram Idli (4 Pcs)",
  "description": "Steamed in traditional handwoven bamboo baskets with cumin, whole black pepper, dried ginger, and fresh curry leaves.",
  "imageUrl": "https://res.cloudinary.com/mylapore/image/upload/v1/dishes/kanchipuram-idli.jpg",
  "priceFormatted": "$12.99",
  "priceMinor": 1299,
  "currency": "USD",
  "categoryName": "Breakfast Tiffins",
  "dietaryTags": ["VEGAN", "JAIN", "GLUTEN_FREE"],
  "spiceLevel": "MILD",
  "allergens": ["SESAME"],
  "ingredients": [
    "Stone-ground aged parboiled rice",
    "Urad dal",
    "Jeera (cumin)",
    "Black peppercorns",
    "Curry leaves",
    "Cold-pressed sesame oil",
    "Hing (asafoetida)"
  ],
  "nutritionServing": "4 pieces (240 g)",
  "reheatingInstructions": "Keep refrigerated at or below 40°F (4°C). Sprinkle 1 tsp water, cover with damp cloth, microwave for 60 seconds or steam for 3 minutes to internal temperature 165°F.",
  "isBlastChilled": true
}
```

---

## 4. Exact-Turn Correlation & Security Rules

1. **Exact-Turn Correlation**:
   - Each turn has a unique `turn_id`. Display blocks are tied to `turn_id` via PostgreSQL foreign keys.
   - The client ignores incoming display blocks whose `turn_id` does not match the active turn currently awaiting resolution.
2. **Never Use Shared `latest_result`**:
   - Global or singleton state variables for `latest_result` are prohibited across backend memory and frontend context. Every result is strictly scoped to `(sessionId, turnId)`.
3. **Rejection of Untrusted or Mismatched Blocks**:
   - The client validates `schema_version === "2.7.0"`. Any mismatched or missing envelope attributes trigger an error boundary and are discarded.
