import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AdsSettings } from '../types';

interface AdSlotProps {
  slotKey: keyof AdsSettings['slots'];
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ slotKey, className = '' }) => {
  const { adsSettings, trackAdImpression, t } = useApp();
  const slotConfig = adsSettings.slots[slotKey];
  const trackedRef = useRef(false);

  useEffect(() => {
    if (adsSettings.adsEnabled && slotConfig?.enabled && !trackedRef.current) {
      trackedRef.current = true;
      trackAdImpression(slotKey, false);
    }
  }, [adsSettings.adsEnabled, slotConfig?.enabled, slotKey, trackAdImpression]);

  useEffect(() => {
    if (
      adsSettings.adsEnabled &&
      adsSettings.adsensePublisherId &&
      slotConfig?.enabled &&
      slotConfig?.slotId
    ) {
      const existingScript = document.querySelector('script[data-berghazi-adsense="true"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
          adsSettings.adsensePublisherId
        )}`;
        script.crossOrigin = 'anonymous';
        script.dataset.berghaziAdsense = 'true';
        document.head.appendChild(script);
      }
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
      } catch {
        // Ignore AdSense push timing if blocked by browser privacy extension
      }
    }
  }, [adsSettings.adsEnabled, adsSettings.adsensePublisherId, slotConfig?.enabled, slotConfig?.slotId]);

  if (!adsSettings.adsEnabled || !slotConfig?.enabled) {
    return null;
  }

  return (
    <aside
      aria-label={t.common.sponsoredLabel}
      className={`my-6 border border-[#E5E4DF] bg-white rounded-xl p-4 no-print ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
        <span>{t.common.sponsoredLabel}</span>
        {adsSettings.customNetworkName && <span>{adsSettings.customNetworkName}</span>}
      </div>
      {adsSettings.adsensePublisherId && slotConfig.slotId ? (
        <ins
          className="adsbygoogle block min-h-[90px]"
          style={{ display: 'block' }}
          data-ad-client={adsSettings.adsensePublisherId}
          data-ad-slot={slotConfig.slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div
          onClick={() => trackAdImpression(slotKey, true)}
          className="min-h-[84px] rounded-lg bg-[#FAFAF8] border border-dashed border-[#D6D3CB] flex items-center justify-center px-4 py-3 text-center text-xs text-[#64748B]"
        >
          <span>
            {adsSettings.adsensePublisherId
              ? `AdSense Publisher (${adsSettings.adsensePublisherId}) · Slot Pending`
              : 'Configured Advertising Placement (Connect AdSense Publisher ID in Admin Dashboard)'}
          </span>
        </div>
      )}
    </aside>
  );
};
