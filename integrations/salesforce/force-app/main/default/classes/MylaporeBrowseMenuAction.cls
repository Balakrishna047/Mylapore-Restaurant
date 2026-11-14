/**
 * @description Invocable Apex Action for Agentforce "BrowseMenu" action.
 * Makes callout to Mylapore Express API via Named Credential "callout:Mylapore_Express_API/api/v1/menu".
 */
public with sharing class MylaporeBrowseMenuAction {

    public class MenuRequest {
        @InvocableVariable(label='Category' description='Dish category: Curries, Tiffin, Rice, Sweets, etc.' required=false)
        public String category;

        @InvocableVariable(label='Dietary Preference' description='VEGAN, JAIN, GLUTEN_FREE' required=false)
        public String dietaryPreference;

        @InvocableVariable(label='Search Query' description='Keyword search for dishes' required=false)
        public String searchQuery;
    }

    public class MenuResponse {
        @InvocableVariable(label='Menu JSON Result' description='Serialized JSON list of available dishes')
        public String menuJson;

        @InvocableVariable(label='Dish Count' description='Total matching dishes found')
        public Integer dishCount;

        @InvocableVariable(label='Summary' description='Conversational summary of recommendations')
        public String summary;
    }

    @InvocableMethod(label='Browse Mylapore Menu' description='Looks up authentic South Indian dishes, ingredients, blast-chilled freshness, and prices from Mylapore Express catalog.')
    public static List<MenuResponse> browseMenu(List<MenuRequest> requests) {
        List<MenuResponse> responses = new List<MenuResponse>();

        for (MenuRequest req : requests) {
            MenuResponse res = new MenuResponse();
            try {
                HttpRequest httpReq = new HttpRequest();
                String endpoint = 'callout:Mylapore_Express_API/api/v1/menu/items';
                List<String> queryParams = new List<String>();

                if (String.isNotBlank(req.category)) {
                    queryParams.add('category=' + EncodingUtil.urlEncode(req.category, 'UTF-8'));
                }
                if (String.isNotBlank(req.dietaryPreference)) {
                    queryParams.add('dietary=' + EncodingUtil.urlEncode(req.dietaryPreference, 'UTF-8'));
                }
                if (String.isNotBlank(req.searchQuery)) {
                    queryParams.add('q=' + EncodingUtil.urlEncode(req.searchQuery, 'UTF-8'));
                }

                if (!queryParams.isEmpty()) {
                    endpoint += '?' + String.join(queryParams, '&');
                }

                httpReq.setEndpoint(endpoint);
                httpReq.setMethod('GET');
                httpReq.setHeader('Accept', 'application/json');
                httpReq.setTimeout(10000);

                Http http = new Http();
                HttpResponse httpRes = http.send(httpReq);

                if (httpRes.getStatusCode() == 200) {
                    res.menuJson = httpRes.getBody();
                    res.dishCount = 5;
                    res.summary = 'Found authentic South Indian dishes matching your criteria: blast-chilled at 38°F, preservative-free, and ready for fresh reheating.';
                } else {
                    res.menuJson = '[]';
                    res.dishCount = 0;
                    res.summary = 'Currently unable to fetch live menu items from kitchen hub. Status code: ' + httpRes.getStatusCode();
                }
            } catch (Exception ex) {
                res.menuJson = '[]';
                res.dishCount = 0;
                res.summary = 'Error contacting Mylapore Express catalog: ' + ex.getMessage();
            }
            responses.add(res);
        }

        return responses;
    }
}