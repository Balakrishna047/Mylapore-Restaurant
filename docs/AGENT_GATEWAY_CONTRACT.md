# Agent Gateway Contract: Salesforce Agentforce & NestJS Backend

**Specification Version**: v2.7 Master Specification (Release 1 Frozen Scope)  
**Host URL**: `https://mylapore-express-api.onrender.com/api/v1/agent`  
**Date**: November 15, 2026  
**Auditor**: Principal Full-Stack Architect & Senior Systems Engineer  

---

## 1. Executive Summary

This contract defines the authoritative REST interface connecting **Salesforce Agentforce Invocable Apex Actions** to the **Mylapore Express Agent Gateway** (`AgentModule`).

All transactional decisions and menu facts are grounded strictly in the NestJS PostgreSQL database. Salesforce Agentforce acts purely as the conversational reasoning engine.

---

## 2. Invocable Action Matrix

The v2.7 Release 1 scope permits strictly **three read-only discovery actions**:

| Action Name | Apex Invocable Class | Gateway REST Endpoint | HTTP Method | Scope |
| :--- | :--- | :--- | :--- | :--- |
| `listMenuCategories` | `Mylapore_Menu_Action.cls` | `/api/v1/agent/browse-menu` | `POST` | List published menu categories |
| `searchMenu` | `Mylapore_Search_Menu_Action.cls` | `/api/v1/agent/search-menu` | `POST` | Search dishes by query, dietary tag, or spice level |
| `getMenuItemDetails` | `Mylapore_Item_Details_Action.cls` | `/api/v1/agent/item-details` | `POST` | Fetch authentic recipe, allergens, ingredients, and reheating steps |

---

## 3. Security & Authentication Architecture

1. **Named Credential**:
   - Outbound callouts from Salesforce execute via `callout:Mylapore_Express_API` (or `callout:Mylapore_Echo_NC`).
   - The Named Credential manages TLS connection handshakes and prevents hardcoding API domains in Apex code.
2. **External Credential & Header Injection**:
   - Salesforce External Credential `Mylapore_Gateway_ExtCred` automatically injects the security header:
     ```http
     X-Gateway-Auth: <GATEWAY_AUTH_TOKEN>
     ```
   - Alternatively, systems may supply:
     ```http
     x-agentforce-api-key: <AGENTFORCE_API_KEY>
     ```
3. **Guard Validation**:
   - The NestJS `AgentforceApiKeyGuard` inspects inbound headers. Requests missing valid authentication tokens are rejected with **HTTP 401 Unauthorized**.

---

## 4. Endpoint Specifications

### 4.1 Action 1: `listMenuCategories` (`POST /api/v1/agent/browse-menu`)

#### Request Headers:
```http
Content-Type: application/json
X-Gateway-Auth: <GATEWAY_AUTH_TOKEN>
```

#### Request Payload:
```json
{
  "categoryId": null,
  "dietary": null,
  "spiceLevel": null
}
```

#### Response Payload (HTTP 200 OK):
```json
{
  "success": true,
  "count": 4,
  "categories": [
    {
      "id": "cat-tiffin-001",
      "name": "Breakfast Tiffins",
      "slug": "breakfast-tiffins",
      "icon": "🥞",
      "itemCount": 4
    },
    {
      "id": "cat-meals-002",
      "name": "Traditional Meals & Thali",
      "slug": "traditional-meals",
      "icon": "🍱",
      "itemCount": 3
    }
  ],
  "items": []
}
```

---

### 4.2 Action 2: `searchMenu` (`POST /api/v1/agent/search-menu`)

#### Request Payload:
```json
{
  "query": "dosa",
  "dietary": "VEGAN",
  "spiceLevel": "MEDIUM",
  "limit": 6
}
```

#### Response Payload (HTTP 200 OK):
```json
{
  "success": true,
  "count": 1,
  "items": [
    {
      "id": "item-dosa-002",
      "slug": "mysore-masala-dosa",
      "name": "Mylapore Ghee Podi Dosa",
      "description": "Crisp golden fermented crepe smeared with aromatic spicy gun powder chutney.",
      "category": "Breakfast Tiffins",
      "basePrice": 14.99,
      "priceFormatted": "$14.99",
      "dietaryTags": ["VEGAN", "GLUTEN_FREE"],
      "spiceLevel": "MEDIUM",
      "isBlastChilled": true,
      "orderCountBadge": "2.5k+ ordered",
      "imageUrl": "https://res.cloudinary.com/mylapore/image/upload/v1/dishes/ghee-podi-dosa.jpg"
    }
  ]
}
```

---

### 4.3 Action 3: `getMenuItemDetails` (`POST /api/v1/agent/item-details`)

#### Request Payload:
```json
{
  "itemId": "item-dosa-002",
  "itemSlug": "mysore-masala-dosa"
}
```

#### Response Payload (HTTP 200 OK):
```json
{
  "success": true,
  "item": {
    "id": "item-dosa-002",
    "slug": "mysore-masala-dosa",
    "name": "Mylapore Ghee Podi Dosa",
    "description": "Crisp golden fermented crepe smeared with aromatic spicy gun powder chutney.",
    "category": "Breakfast Tiffins",
    "basePrice": 14.99,
    "priceFormatted": "$14.99",
    "dietaryTags": ["VEGAN", "GLUTEN_FREE"],
    "spiceLevel": "MEDIUM",
    "allergens": ["SESAME"],
    "ingredients": [
      "Naturally fermented rice and urad dal batter",
      "Stone-ground roasted chana dal podi",
      "Dry red chilies",
      "Curry leaves",
      "Cold-pressed sesame oil"
    ],
    "nutritionServing": "1 dosa with sambar & chutney (280 g)",
    "reheatingInstructions": "Refrigerate at <=40°F (4°C). Reheat on preheated flat skillet over medium heat for 90 seconds until crispy. Heat sambar to 165°F.",
    "isBlastChilled": true
  }
}
```

---

## 5. Gateway Error Handling & Status Codes

| HTTP Status | Condition | Agentforce Action Behavior |
| :--- | :--- | :--- |
| `200 OK` | Query succeeded with grounded PostgreSQL records | Apex populates output variables; Agent presents verified results. |
| `400 Bad Request` | Malformed parameters or invalid dietary enum | Apex returns descriptive validation error string to Agent. |
| `401 Unauthorized` | Invalid or absent `X-Gateway-Auth` token | Apex logs security alarm; agent informs customer of administrative pause. |
| `404 Not Found` | Requested dish ID or slug does not exist in catalog | Apex returns empty item; Agent suggests category options. |
| `429 Too Many Requests` | Outbound rate limit exceeded | Agent returns retry advisory. |
| `500 Server Error` | Database connection timeout | Agent engages deterministic category fallback. |
