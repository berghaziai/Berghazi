import React, { useEffect, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Loader2, MapPin, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LatLng {
  lat: number;
  lng: number;
}

interface RegionFocus {
  id: string;
  label: string;
  labelTifinagh: string;
  center: LatLng;
  zoom: number;
  placesQuery: string;
}

const REGION_FOCUSES: RegionFocus[] = [
  {
    id: 'morocco',
    label: 'Morocco Overview',
    labelTifinagh: 'ⵍⵎⵖⵔⵉⴱ',
    center: { lat: 31.7917, lng: -7.0926 },
    zoom: 6,
    placesQuery: 'Amazigh heritage museum cultural center Morocco',
  },
  {
    id: 'rabat',
    label: 'Rabat',
    labelTifinagh: 'ⵕⵕⴱⴰⵟ',
    center: { lat: 34.0209, lng: -6.8416 },
    zoom: 12,
    placesQuery: 'Amazigh culture museum institute Rabat Morocco',
  },
  {
    id: 'agadir',
    label: 'Souss-Massa · Agadir',
    labelTifinagh: 'ⴰⴳⴰⴷⵉⵔ · ⵙⵓⵙ',
    center: { lat: 30.4278, lng: -9.5981 },
    zoom: 12,
    placesQuery: 'Amazigh heritage museum Agadir Morocco',
  },
  {
    id: 'ouarzazate',
    label: 'Ouarzazate · Drâa',
    labelTifinagh: 'ⵡⴰⵔⵣⴰⵣⴰⵜ',
    center: { lat: 30.9335, lng: -6.937 },
    zoom: 10,
    placesQuery: 'Kasbah heritage museum Ouarzazate Morocco',
  },
  {
    id: 'midelt',
    label: 'Middle Atlas · Midelt',
    labelTifinagh: 'ⴰⵟⵍⴰⵙ ⴰⵏⴰⵎⵎⴰⵙ',
    center: { lat: 32.6852, lng: -4.7451 },
    zoom: 10,
    placesQuery: 'cultural center museum Midelt Morocco',
  },
  {
    id: 'nador',
    label: 'Rif · Nador',
    labelTifinagh: 'ⴰⵔⵔⵉⴼ · ⵏⵏⴰⴹⵓⵔ',
    center: { lat: 35.1681, lng: -2.9335 },
    zoom: 11,
    placesQuery: 'cultural center museum Nador Morocco',
  },
];

interface LivePlaceMarker {
  id: string;
  name: string;
  address: string;
  position: LatLng;
}

interface GroundedPlace {
  uri: string;
  title: string;
  reviewSnippets?: { uri: string; title: string; author: string }[];
}

const PlaceMarkerItem: React.FC<{
  place: LivePlaceMarker;
  isOpen: boolean;
  onSelect: () => void;
  onClose: () => void;
}> = ({ place, isOpen, onSelect, onClose }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.position}
        title={place.name}
        onClick={onSelect}
      >
        <Pin background="#1D3A5F" borderColor="#C68B1C" glyphColor="#E5AD44" />
      </AdvancedMarker>
      {isOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={onClose} maxWidth={260}>
          <div className="p-1 space-y-1 text-[#16222E]">
            <div className="text-sm font-semibold">{place.name}</div>
            {place.address && <div className="text-xs text-[#475569]">{place.address}</div>}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const DynamicPlacesLayer: React.FC<{
  activeRegion: RegionFocus;
  selectedPlaceId: string | null;
  onSelectPlace: (id: string | null) => void;
  onPlacesLoaded: (places: LivePlaceMarker[]) => void;
  onPlacesError: (msg: string | null) => void;
}> = ({ activeRegion, selectedPlaceId, onSelectPlace, onPlacesLoaded, onPlacesError }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [places, setPlaces] = useState<LivePlaceMarker[]>([]);

  useEffect(() => {
    if (!map) return;
    map.panTo(activeRegion.center);
    map.setZoom(activeRegion.zoom);
  }, [map, activeRegion]);

  useEffect(() => {
    if (!placesLib) return;
    let cancelled = false;

    const searchPlaces = async () => {
      onPlacesError(null);
      try {
        const PlaceCtor = (placesLib as unknown as {
          Place?: {
            searchByText?: (req: {
              textQuery: string;
              fields: string[];
              locationBias?: LatLng;
              maxResultCount?: number;
            }) => Promise<{
              places?: Array<{
                id?: string;
                displayName?: string;
                formattedAddress?: string;
                location?: { lat: () => number; lng: () => number };
              }>;
            }>;
          };
        }).Place;

        if (!PlaceCtor?.searchByText) return;

        const { places: rawPlaces = [] } = await PlaceCtor.searchByText({
          textQuery: activeRegion.placesQuery,
          fields: ['id', 'displayName', 'formattedAddress', 'location'],
          locationBias: activeRegion.center,
          maxResultCount: 8,
        });

        if (cancelled) return;

        const mapped: LivePlaceMarker[] = rawPlaces
          .filter((p) => p.location && p.displayName)
          .map((p, idx) => ({
            id: p.id || `${activeRegion.id}_${idx}`,
            name: p.displayName || 'Cultural Site',
            address: p.formattedAddress || '',
            position: {
              lat: p.location!.lat(),
              lng: p.location!.lng(),
            },
          }));

        setPlaces(mapped);
        onPlacesLoaded(mapped);
        if (mapped.length > 0) {
          onSelectPlace(mapped[0].id);
        } else {
          onSelectPlace(null);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('Quota') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onPlacesError('Live Places search could not be loaded for this region.');
      }
    };

    void searchPlaces();
    return () => {
      cancelled = true;
    };
  }, [placesLib, activeRegion, onPlacesLoaded, onPlacesError, onSelectPlace]);

  return (
    <>
      {places.map((place) => (
        <PlaceMarkerItem
          key={place.id}
          place={place}
          isOpen={selectedPlaceId === place.id}
          onSelect={() => onSelectPlace(place.id)}
          onClose={() => onSelectPlace(null)}
        />
      ))}
    </>
  );
};

export const HeritageMapPanel: React.FC = () => {
  const { language } = useApp();
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [activeRegionId, setActiveRegionId] = useState<string>('morocco');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [livePlaces, setLivePlaces] = useState<LivePlaceMarker[]>([]);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(
    'Museums, Amazigh heritage kasbahs, or historical sites in Morocco'
  );
  const [groundingLoading, setGroundingLoading] = useState(false);
  const [groundingSummary, setGroundingSummary] = useState('');
  const [groundedPlaces, setGroundedPlaces] = useState<GroundedPlace[]>([]);
  const [groundingError, setGroundingError] = useState<string | null>(null);

  const activeRegion =
    REGION_FOCUSES.find((r) => r.id === activeRegionId) || REGION_FOCUSES[0];

  useEffect(() => {
    if (mapsApiKey) return;
    fetch('/api/config/status')
      .then((r) => r.json())
      .then((d) => {
        if (d.mapsApiKey) setMapsApiKey(d.mapsApiKey);
      })
      .catch(() => {});
  }, [mapsApiKey]);

  const handleMapsGroundingSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || groundingLoading) return;
    setGroundingLoading(true);
    setGroundingError(null);
    setGroundingSummary('');
    setGroundedPlaces([]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: searchQuery.trim(),
          grounding: 'maps',
          latLng: {
            latitude: activeRegion.center.lat,
            longitude: activeRegion.center.lng,
          },
          systemInstruction:
            'Provide concise, accurate Moroccan Amazigh geographic & cultural heritage place recommendations.',
        }),
      });
      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      const json = await res.json();
      if (json?.error?.status === 'RESOURCE_EXHAUSTED') {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      if (!res.ok) throw new Error(json.error || 'Maps grounding query failed.');
      setGroundingSummary(json.text || '');
      setGroundedPlaces(Array.isArray(json.mapsSources) ? json.mapsSources : []);
    } catch (err) {
      setGroundingError(
        err instanceof Error ? err.message : 'Unable to query Google Maps grounding.'
      );
    } finally {
      setGroundingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E4DF] rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5E4DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#16222E]">
              Tamazgha &amp; Moroccan Atlas Heritage Map
            </h2>
            <p className="text-xs text-[#64748B]">
              Explore regional Amazigh museums and heritage sites using Google Maps Platform live Places discovery.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {REGION_FOCUSES.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => setActiveRegionId(region.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                  activeRegionId === region.id
                    ? 'bg-[#1D3A5F] text-white border-[#1D3A5F]'
                    : 'bg-[#FAFAF8] text-[#475569] border-[#E5E4DF] hover:border-[#C68B1C]'
                }`}
              >
                {region.label}
              </button>
            ))}
          </div>
        </div>

        {mapsApiKey ? (
          <div className="w-full h-[440px]">
            <APIProvider
              apiKey={mapsApiKey}
              language={language === 'ar' ? 'ar' : 'en'}
              region="MA"
            >
              <GoogleMap
                defaultCenter={REGION_FOCUSES[0].center}
                defaultZoom={REGION_FOCUSES[0].zoom}
                mapId="DEMO_MAP_ID"
                gestureHandling="greedy"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                <DynamicPlacesLayer
                  activeRegion={activeRegion}
                  selectedPlaceId={selectedPlaceId}
                  onSelectPlace={setSelectedPlaceId}
                  onPlacesLoaded={setLivePlaces}
                  onPlacesError={setPlacesError}
                />
              </GoogleMap>
            </APIProvider>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#FAFAF8] space-y-2">
            <MapPin className="w-7 h-7 text-[#C68B1C] mx-auto" />
            <p className="text-sm font-medium text-[#16222E]">
              Google Maps API Key Pending Runtime Injection
            </p>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Ensure your provisioned Google Maps Platform key (`VITE_GOOGLE_MAPS_API_KEY`) is attached in the environment or Settings &gt; Secrets, then reload.
            </p>
          </div>
        )}

        {(placesError || livePlaces.length > 0) && (
          <div className="p-4 border-t border-[#E5E4DF] bg-[#FAFAF8] space-y-2">
            {placesError && <p className="text-xs text-[#9A3412]">{placesError}</p>}
            {livePlaces.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {livePlaces.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => setSelectedPlaceId(pl.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs border text-left transition-colors ${
                      selectedPlaceId === pl.id
                        ? 'bg-[#1D3A5F] text-white border-[#1D3A5F]'
                        : 'bg-white text-[#16222E] border-[#E5E4DF] hover:border-[#C68B1C]'
                    }`}
                  >
                    {pl.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gemini Google Maps Grounding Search */}
      <div className="bg-white border border-[#E5E4DF] rounded-2xl p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#16222E]">
            Discover Live Places via Gemini Maps Grounding
          </h3>
          <p className="text-xs text-[#64748B]">
            Query real-world cultural museums, libraries, and Amazigh heritage sites grounded with verified Google Maps links.
          </p>
        </div>

        <form onSubmit={handleMapsGroundingSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search heritage sites, museums, or cultural centers..."
            className="flex-1 px-3.5 py-2 text-sm bg-[#FAFAF8] border border-[#D6D3CB] rounded-xl"
          />
          <button
            type="submit"
            disabled={groundingLoading || !searchQuery.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1D3A5F] text-white hover:bg-[#16222E] disabled:opacity-50"
          >
            {groundingLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Search Places</span>
          </button>
        </form>

        {groundingError && (
          <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#9A3412]/30 text-xs text-[#9A3412]">
            {groundingError}
          </div>
        )}

        {groundingSummary && (
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E5E4DF] space-y-3">
            <div className="text-sm text-[#16222E] whitespace-pre-wrap">{groundingSummary}</div>
            {groundedPlaces.length > 0 && (
              <div className="pt-3 border-t border-[#E5E4DF] space-y-2">
                <div className="text-xs font-semibold text-[#475569]">
                  Google Maps Grounded Links
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groundedPlaces.map((pl, idx) => (
                    <div
                      key={`${pl.uri}_${idx}`}
                      className="p-2.5 rounded-lg bg-white border border-[#E5E4DF] text-xs space-y-1"
                    >
                      <a
                        href={pl.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#1D3A5F] hover:text-[#C68B1C] underline inline-flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{pl.title}</span>
                      </a>
                      {pl.reviewSnippets && pl.reviewSnippets.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-[11px] text-[#64748B]">
                          {pl.reviewSnippets.map((r, ri) => (
                            <a
                              key={ri}
                              href={r.uri || pl.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              {r.title || r.author || 'Review'}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
