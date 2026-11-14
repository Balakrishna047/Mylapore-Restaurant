# Salesforce Agentforce v2.7 Implementation & Configuration Guide
**Mylapore Express Enterprise Restaurant Platform**

---

## 1. Executive Summary & Governing Doctrine

Mylapore Express v2.7 introduces an enterprise-grade conversational South Indian restaurant menu discovery experience powered by **Salesforce Agentforce**, backed by a dedicated **BFF (Backend-for-Frontend)**, and grounded in the PostgreSQL source of truth.

### The Governing Doctrine:
> **"The AI talks; the backend decides."**
> 
> *The AI agent handles natural language conversation, intent recognition, and customer interaction. The backend owns prices, item availability, diet tags, display blocks, session state, and transactional authorization. The AI is never allowed to invent, recalculate, or hallucinate restaurant data.*

---

## 2. Hard Scope & Guardrails (Release 1 Frozen Scope)

- **Flow 1: Chat Initialization:**
  - Anonymous guest session handshake (`POST /api/v1/chat/session`)
  - Deterministic welcome greeting & category button pills
- **Flow 2: Menu Discovery (3 Read-Only Agentforce Actions):**
  1. `listMenuCategories` (`POST /api/v1/agent/menu/categories`)
  2. `searchMenu` (`POST /api/v1/agent/menu/search`)
  3. `getMenuItemDetails` (`GET /api/v1/agent/menu/items/:itemId`)
- **Strictly Prohibited:** No cart, checkout, payments, ordering, delivery tracking, loyalty points, contact sync, or support cases inside chat.

---

## 3. Apex Invocable Action Classes

### Action 1: List Menu Categories (`MylaporeListMenuCategoriesAction.cls`)
```apex
public with sharing class MylaporeListMenuCategoriesAction {
    public class Request {
        @InvocableVariable(label='Outlet ID' description='Restaurant outlet identifier' required=false)
        public String outletId;
    }

    public class Response {
        @InvocableVariable(label='Categories JSON' description='JSON serialized category buttons and counts')
        public String categoriesJson;
        @InvocableVariable(label='Is Success')
        public Boolean success;
    }

    @InvocableMethod(label='List Menu Categories' description='Retrieves published South Indian menu categories from Mylapore Express backend' category='Mylapore Express')
    public static List<Response> listCategories(List<Request> requests) {
        List<Response> responses = new List<Response>();
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Mylapore_API/api/v1/agent/menu/categories');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody('{}');

        try {
            HttpResponse res = http.send(req);
            Response resp = new Response();
            if (res.getStatusCode() == 200) {
                resp.categoriesJson = res.getBody();
                resp.success = true;
            } else {
                resp.success = false;
                resp.categoriesJson = '[]';
            }
            responses.add(resp);
        } catch (Exception e) {
            Response errResp = new Response();
            errResp.success = false;
            errResp.categoriesJson = '[]';
            responses.add(errResp);
        }
        return responses;
    }
}
```

---

### Action 2: Search Menu (`MylaporeSearchMenuAction.cls`)
```apex
public with sharing class MylaporeSearchMenuAction {
    public class Request {
        @InvocableVariable(label='Search Query' description='Dish name, keyword, or category' required=false)
        public String query;
        @InvocableVariable(label='Dietary Filter' description='Comma-separated dietary tags (e.g., JAIN, VEGAN)' required=false)
        public String dietaryFilter;
    }

    public class Response {
        @InvocableVariable(label='Dishes JSON' description='JSON array of dishes with exact backend prices')
        public String dishesJson;
        @InvocableVariable(label='Result Count')
        public Integer resultCount;
    }

    @InvocableMethod(label='Search Menu Dishes' description='Searches dishes with dietary filters and exact backend pricing' category='Mylapore Express')
    public static List<Response> searchDishes(List<Request> requests) {
        List<Response> responses = new List<Response>();
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Mylapore_API/api/v1/agent/menu/search');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');

        Request r = requests[0];
        Map<String, Object> payload = new Map<String, Object>();
        if (String.isNotBlank(r.query)) payload.put('query', r.query);
        if (String.isNotBlank(r.dietaryFilter)) payload.put('dietaryTags', r.dietaryFilter.split(','));

        req.setBody(JSON.serialize(payload));

        try {
            HttpResponse res = http.send(req);
            Response resp = new Response();
            if (res.getStatusCode() == 200) {
                resp.dishesJson = res.getBody();
                resp.resultCount = 1;
            } else {
                resp.dishesJson = '{"items":[]}';
                resp.resultCount = 0;
            }
            responses.add(resp);
        } catch (Exception e) {
            Response errResp = new Response();
            errResp.dishesJson = '{"items":[]}';
            errResp.resultCount = 0;
            responses.add(errResp);
        }
        return responses;
    }
}
```

---

### Action 3: Get Menu Item Details (`MylaporeGetMenuItemDetailsAction.cls`)
```apex
public with sharing class MylaporeGetMenuItemDetailsAction {
    public class Request {
        @InvocableVariable(label='Menu Item ID or Slug' description='Unique identifier of the dish' required=true)
        public String itemId;
    }

    public class Response {
        @InvocableVariable(label='Dish Details JSON' description='Full ingredients, allergen matrix, and reheating guidelines')
        public String detailsJson;
        @InvocableVariable(label='Is Success')
        public Boolean success;
    }

    @InvocableMethod(label='Get Menu Item Details' description='Fetches authentic ingredients, allergen warnings, and preparation guidelines' category='Mylapore Express')
    public static List<Response> getItemDetails(List<Request> requests) {
        List<Response> responses = new List<Response>();
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        String itemId = EncodingUtil.urlEncode(requests[0].itemId, 'UTF-8');
        req.setEndpoint('callout:Mylapore_API/api/v1/agent/menu/items/' + itemId);
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');

        try {
            HttpResponse res = http.send(req);
            Response resp = new Response();
            if (res.getStatusCode() == 200) {
                resp.detailsJson = res.getBody();
                resp.success = true;
            } else {
                resp.success = false;
                resp.detailsJson = '{}';
            }
            responses.add(resp);
        } catch (Exception e) {
            Response errResp = new Response();
            errResp.success = false;
            errResp.detailsJson = '{}';
            responses.add(errResp);
        }
        return responses;
    }
}
```

---

## 4. Salesforce Named Credential Setup

1. **Navigate to:** `Setup` → `Security` → `Named Credentials`
2. **Create External Credential:**
   - **Name:** `Mylapore_API_Ext`
   - **Authentication Protocol:** `Custom`
   - **Custom Headers:**
     - Header Name: `x-agentforce-api-key`
     - Header Value: `mylapore-agentforce-secret-2026`
3. **Create Named Credential:**
   - **Label:** `Mylapore_API`
   - **Name:** `Mylapore_API`
   - **URL:** `https://mylapore-express-api.onrender.com`
   - **External Credential:** `Mylapore_API_Ext`
   - **Generate Authorization Header:** Unchecked

---

## 5. Agentforce Agent Instructions (Grounding Prompt)

Paste the following system instruction directly into the Agentforce Agent Builder:

```text
You are the Mylapore Express Restaurant Concierge, a warm, hospitable culinary guide for authentic South Indian gastronomy.

CRITICAL INSTRUCTIONS & GUARDRAILS:
1. THE BACKEND DECIDES: Never guess, calculate, or hallucinate menu item prices, spice levels, allergen contents, or inventory availability. Always invoke the appropriate Mylapore Express action.
2. FLOW 1 (GREETING & CATEGORIES): When a customer begins a conversation, welcome them with "Namaskaram!" and present the menu categories using `listMenuCategories`.
3. FLOW 2 (MENU DISCOVERY): When a user asks about dishes, dietary options (Jain, Vegan, Gluten-Free), or ingredients:
   - For keyword or dietary inquiries, call `searchMenu`.
   - For specific dish preparation, ingredients, or allergens, call `getMenuItemDetails`.
4. STRICT PROHIBITION: You must NEVER handle cart modifications, checkout, payments, or order placements. If asked to buy or place an order, politely guide the customer to use the menu and cart buttons on the website storefront.
```
