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
    initEmbeddedMessaging?: () => void;
  }
}

/**
 * Salesforce Messaging for In-App & Web (MIAW) Integration.
 * 
 * Embeds the official, active Salesforce Agentforce Service Agent:
 * - Org ID: 00Dg700000Oo6fV
 * - Deployment Name: Mylapore_Concierge_Web
 * - Site URL: https://orgfarm-b2714d8f72-dev-ed.develop.my.site.com/ESWMylaporeConci1794475036498
 * - SCRT2 URL: https://orgfarm-b2714d8f72-dev-ed.develop.my.salesforce-scrt.com
 * - Bootstrap Script: /assets/js/bootstrap.min.js
 */
export default function ChatWidget() {
  useEffect(() => {
    // Verified Salesforce MIAW parameters (with environment variable override support)
    const orgId = process.env.NEXT_PUBLIC_SALESFORCE_ORG_ID || '00Dg700000Oo6fV';
    const deploymentName = process.env.NEXT_PUBLIC_SALESFORCE_DEPLOYMENT_NAME || 'Mylapore_Concierge_Web';
    const siteUrl =
      process.env.NEXT_PUBLIC_SALESFORCE_SITE_URL ||
      'https://orgfarm-b2714d8f72-dev-ed.develop.my.site.com/ESWMylaporeConci1794475036498';
    const scrt2Url =
      process.env.NEXT_PUBLIC_SALESFORCE_SCRT2_URL ||
      'https://orgfarm-b2714d8f72-dev-ed.develop.my.salesforce-scrt.com';
    const bootstrapUrl =
      process.env.NEXT_PUBLIC_SALESFORCE_MIAW_URL ||
      `${siteUrl}/assets/js/bootstrap.min.js`;

    const initMessaging = () => {
      try {
        if (window.embeddedservice_bootstrap) {
          window.embeddedservice_bootstrap.settings.language = 'en_US';
          window.embeddedservice_bootstrap.init(orgId, deploymentName, siteUrl, {
            scrt2URL: scrt2Url
          });
          console.log('[Salesforce Agentforce] MIAW live bot successfully initialized.');
        }
      } catch (err) {
        console.error('[Salesforce Agentforce] Error loading Salesforce Embedded Messaging:', err);
      }
    };

    window.initEmbeddedMessaging = initMessaging;

    const scriptId = 'salesforce-miaw-bootstrap-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = bootstrapUrl;
      script.async = true;

      script.onload = () => {
        initMessaging();
      };

      script.onerror = (e) => {
        console.error('[Salesforce Agentforce] Failed to load bootstrap.min.js script:', e);
      };

      document.body.appendChild(script);
    } else if (window.embeddedservice_bootstrap) {
      initMessaging();
    }
  }, []);

  // Salesforce MIAW renders its own official floating launcher into the DOM
  return null;
}
