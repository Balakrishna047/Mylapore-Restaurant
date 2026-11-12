'use client';

import { useEffect } from 'react';

export default function SalesforceChatEmbed() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    const orgId = '00Dg700000Oo6fV';
    const deploymentName = 'Mylapore_Concierge_Web';
    const siteUrl = 'https://orgfarm-b2714d8f72-dev-ed.develop.my.site.com/ESWMylaporeConci1794475036498';
    const scrt2Url = 'https://orgfarm-b2714d8f72-dev-ed.develop.my.salesforce-scrt.com';
    const scriptSrc = `${siteUrl}/assets/js/bootstrap.min.js`;

    function initMessaging() {
      try {
        if ((window as any).embeddedservice_bootstrap) {
          (window as any).embeddedservice_bootstrap.settings.language = 'en_US';
          (window as any).embeddedservice_bootstrap.init(
            orgId,
            deploymentName,
            siteUrl,
            {
              scrt2URL: scrt2Url
            }
          );
          console.log('[Salesforce Agentforce] MIAW live bot initialized successfully.');
        }
      } catch (err) {
        console.error('[Salesforce Agentforce] Error initializing Embedded Messaging: ', err);
      }
    }

    // Check if script already appended
    let script = document.getElementById('salesforce-miaw-script') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'salesforce-miaw-script';
      script.src = scriptSrc;
      script.async = true;
      script.onload = () => {
        initMessaging();
      };
      document.body.appendChild(script);
    } else {
      initMessaging();
    }
  }, []);

  return null;
}
