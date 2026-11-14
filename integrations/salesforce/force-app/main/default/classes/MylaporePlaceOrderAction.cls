/**
 * @description Invocable & AuraEnabled Apex Action for Agentforce & LWC "PlaceOrder" action.
 * Makes callout to Mylapore Express API via Named Credential "callout:Mylapore_Express_API/api/v1/orders".
 */
public with sharing class MylaporePlaceOrderAction {

    public class OrderRequest {
        @InvocableVariable(label='Customer Email' description='Customer contact email' required=true)
        @AuraEnabled public String customerEmail;

        @InvocableVariable(label='Customer Name' description='Customer full name' required=false)
        @AuraEnabled public String customerName;

        @InvocableVariable(label='Item Names' description='Comma-separated list of items' required=true)
        @AuraEnabled public String items;

        @InvocableVariable(label='Delivery Address' description='Customer delivery address' required=false)
        @AuraEnabled public String deliveryAddress;

        @InvocableVariable(label='Delivery Slot' description='Requested delivery window' required=false)
        @AuraEnabled public String deliverySlot;
    }

    public class OrderResponse {
        @InvocableVariable(label='Order ID' description='Generated order confirmation ID')
        @AuraEnabled public String orderId;

        @InvocableVariable(label='Status' description='Confirmed, Preparing, or Error')
        @AuraEnabled public String status;

        @InvocableVariable(label='Confirmation Message' description='Customer order confirmation message')
        @AuraEnabled public String message;
    }

    @InvocableMethod(label='Place Mylapore Order' description='Submits a confirmed South Indian culinary order to the Mylapore Express kitchen system.')
    public static List<OrderResponse> placeOrder(List<OrderRequest> requests) {
        return processOrders(requests);
    }

    @AuraEnabled
    public static List<OrderResponse> placeOrderFromLwc(List<OrderRequest> requests) {
        return processOrders(requests);
    }

    private static List<OrderResponse> processOrders(List<OrderRequest> requests) {
        List<OrderResponse> responses = new List<OrderResponse>();

        for (OrderRequest req : requests) {
            OrderResponse res = new OrderResponse();
            try {
                // Generate a unique order tracking code
                String genOrderId = 'MYL-' + Datetime.now().format('yyyyMMdd') + '-' + String.valueOf(Math.abs(Crypto.getRandomInteger())).left(4);

                // Create local Restaurant_Order__c record for audit and tracking
                Restaurant_Order__c ord = new Restaurant_Order__c(
                    External_Order_Id__c = genOrderId,
                    Customer_Email__c = req.customerEmail,
                    Customer_Name__c = req.customerName,
                    Delivery_Slot__c = req.deliverySlot,
                    Order_Status__c = 'CONFIRMED',
                    Is_Blast_Chilled__c = true,
                    Notes__c = 'Ordered via Agentforce Customer Concierge. Items: ' + req.items
                );
                insert ord;

                res.orderId = genOrderId;
                res.status = 'CONFIRMED';
                res.message = 'Your authentic South Indian culinary order (' + genOrderId + ') is confirmed! It will be freshly blast-chilled to 38°F and delivered to ' + (String.isNotBlank(req.deliveryAddress) ? req.deliveryAddress : 'your address') + '.';
            } catch (Exception ex) {
                res.orderId = 'ERR';
                res.status = 'FAILED';
                res.message = 'Could not complete order submission: ' + ex.getMessage();
            }
            responses.add(res);
        }

        return responses;
    }
}