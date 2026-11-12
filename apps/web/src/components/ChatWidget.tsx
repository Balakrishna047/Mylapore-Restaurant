'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    embeddedservice_bootstrap?: {
      settings: Record<string, any>;
      init: (
        orgId: string,
        deploymentName: string,
        siteUrl: string,
        config: { scrt2URL?: string }
      ) => void;
      util?: any;
    };
  }
}

/**
 * Salesforce Messaging for In-App & Web (MIAW) Integration.
 * 
 * Strict Architectural Rule:
 * All mock/local chat widgets are removed. The bot is ONLY mounted and made visible
 * when deployed through authentic Salesforce Embedded Service (MIAW).
 * If Salesforce MIAW is not configured via environment variables, this component
 * renders null, ensuring zero mock bot UI appears on the storefront.
 */
export default function ChatWidget() {
  useEffect(() => {
    // Read Salesforce MIAW configuration from environment
    const bootstrapUrl = process.env.NEXT_PUBLIC_SALESFORCE_MIAW_URL;
    const orgId = process.env.NEXT_PUBLIC_SALESFORCE_ORG_ID;
    const deploymentName = process.env.NEXT_PUBLIC_SALESFORCE_DEPLOYMENT_NAME;
    const siteUrl = process.env.NEXT_PUBLIC_SALESFORCE_SITE_URL || bootstrapUrl?.replace(/\/assets\/js\/.*$/, '');
    const scrt2Url = process.env.NEXT_PUBLIC_SALESFORCE_SCRT2_URL;

    // If Salesforce MIAW is not configured, do not load any chat
    if (!bootstrapUrl && (!orgId || !deploymentName)) {
      if (process.env.NODE_ENV === 'development') {
        console.info(
          '[Salesforce Agentforce] Storefront chat inactive. Deploy through Salesforce MIAW (set NEXT_PUBLIC_SALESFORCE_MIAW_URL or NEXT_PUBLIC_SALESFORCE_ORG_ID) to activate live Agentforce Concierge.'
        );
      }
      return;
    }

    // When deployed through Salesforce, dynamically inject the official MIAW bootstrap script
    const scriptId = 'salesforce-miaw-bootstrap-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src =
        bootstrapUrl ||
        `${siteUrl}/assets/js/embeddedservice_bootstrap.min.js`;
      script.async = true;

      script.onload = () => {
        try {
          if (window.embeddedservice_bootstrap && orgId && deploymentName && siteUrl) {
            window.embeddedservice_bootstrap.settings.language = 'en_US';
            window.embeddedservice_bootstrap.init(orgId, deploymentName, siteUrl, {
              scrt2URL: scrt2Url
            });
            console.log('[Salesforce Agentforce] MIAW live bot successfully initialized.');
          }
        } catch (err) {
          console.error('[Salesforce Agentforce] Error initializing MIAW bootstrap:', err);
        }
      };

      script.onerror = () => {
        console.error('[Salesforce Agentforce] Failed to load Salesforce MIAW script.');
      };

      document.body.appendChild(script);
    }
  }, []);

  // When deployed through Salesforce MIAW, Salesforce injects its own native floating launcher into the DOM.
  // No local/mock React bot button or window is rendered.
  return null;
}
