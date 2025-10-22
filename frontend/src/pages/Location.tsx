// src/pages/location.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./location.css";

type Place = {
    label: string;
    lat: number;
    lon: number;
    distKm?: number;
};

const LONGDO_KEY = "bf881d6834afa68c0afa5137ac184dac";

function loadLongdo(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).longdo) return resolve();
        const s = document.createElement("script");
        s.src = `https://api.longdo.com/map/?key=${LONGDO_KEY}`;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Load Longdo Map failed"));
        document.head.appendChild(s);
    });
}

async function geocode(q: string): Promise<Place[]> {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=12&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "Accept-Language": "th" } });
    const rows = (await res.json()) as any[];
    return rows.map((r) => ({
        label: r.display_name as string,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
    }));
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { headers: { "Accept-Language": "th" } });
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const la1 = (a.lat * Math.PI) / 180;
    const la2 = (b.lat * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(la1) * Math.cos(la2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * c;
}

function LocationIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "0 0 auto" }}>
            <path d="M12 22s7-7.06 7-12a7 7 0 1 0-14 0c0 4.94 7 12 7 12Z" fill="currentColor" opacity="0.2" />
            <path d="M12 22s7-7.06 7-12a7 7 0 1 0-14 0c0 4.94 7 12 7 12Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.5" fill="currentColor" />
        </svg>
    );
}

function splitLabel(label: string) {
    const [name, ...restArr] = label.split(",");
    const nameTrim = name?.trim() || label;
    const rest = restArr.join(", ").trim();
    return { name: nameTrim, rest };
}

export default function Location() {
    const navigate = useNavigate();

    const mapEl = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    const [query, setQuery] = useState("");
    const [current, setCurrent] = useState<Place | null>(null);
    const [suggested, setSuggested] = useState<Place[]>([]);
    const [picked, setPicked] = useState<Place | null>(null);
    const [loadingMap, setLoadingMap] = useState(true);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function init() {
            try {
                await loadLongdo();
                if (!mounted || !mapEl.current) return;
                const longdo = (window as any).longdo;
                mapRef.current = new longdo.Map({ placeholder: mapEl.current, zoom: 15 });

                const showOnMap = (p: Place) => {
                    mapRef.current.location({ lon: p.lon, lat: p.lat }, true);
                    if (markerRef.current) mapRef.current.Overlays.remove(markerRef.current);
                    markerRef.current = new longdo.Marker({ lon: p.lon, lat: p.lat });
                    mapRef.current.Overlays.add(markerRef.current);
                };

                const onReady = async (lat: number, lon: number) => {
                    const label = await reverseGeocode(lat, lon);
                    const me: Place = { label, lat, lon };
                    setCurrent(me);
                    setPicked(me);
                    showOnMap(me);
                    setLoadingMap(false);
                    setSuggested([me]);
                };

                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => onReady(pos.coords.latitude, pos.coords.longitude),
                        () => onReady(13.736717, 100.523186),
                        { enableHighAccuracy: true, timeout: 7000 }
                    );
                } else {
                    onReady(13.736717, 100.523186);
                }
            } catch {
                setLoadingMap(false);
            }
        }
        init();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setSearching(false);
            if (picked) setSuggested([picked]);
            else if (current) setSuggested([current]);
            return;
        }
        setSearching(true);
    }, [query]);

    useEffect(() => {
        let t: number | undefined;
        if (!searching || !query.trim()) return;
        t = window.setTimeout(async () => {
            const rows = await geocode(query.trim());
            const withDist =
                current
                    ? rows.map((r) => ({
                        ...r,
                        distKm: distanceKm({ lat: current.lat, lon: current.lon }, { lat: r.lat, lon: r.lon }),
                    }))
                    : rows;
            setSuggested(withDist);
        }, 250);
        return () => clearTimeout(t);
    }, [searching, query, current?.lat, current?.lon]);

    const moveTo = (p: Place) => {
        setPicked(p);
        if (mapRef.current && (window as any).longdo) {
            const longdo = (window as any).longdo;
            mapRef.current.location({ lon: p.lon, lat: p.lat }, true);
            if (markerRef.current) mapRef.current.Overlays.remove(markerRef.current);
            markerRef.current = new longdo.Marker({ lon: p.lon, lat: p.lat });
            mapRef.current.Overlays.add(markerRef.current);
        }
        setSuggested([p]);
        setSearching(false);
        setQuery("");
    };

    const confirm = () => {
        if (!picked) return;
        const onlyName = picked.label.split(",")[0].trim();
        sessionStorage.setItem("selectedPlaceName", onlyName);
        navigate(-1);
    };

    const visibleSuggested = (suggested || []).slice(0, 2);

    return (
        <div className="loc-wrap">
            <div className="search-row">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ที่อยู่ปัจจุบัน"
                    className="search-input"
                    style={{ fontWeight: 400 }}
                />
                <button className="search-icon" onClick={() => setSearching(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </button>
            </div>

            <div className="map-box">
                {loadingMap && <div className="map-loading">กำลังโหลดแผนที่…</div>}
                <div ref={mapEl} className="map-host" />
            </div>

            <div className="suggest-title">Suggested</div>

            <div className="list" style={{ paddingBottom: 8 }}>
                {visibleSuggested.map((s, i) => {
                    const { name, rest } = splitLabel(s.label);
                    return (
                        <button
                            key={`${s.lat}-${s.lon}-${i}`}
                            className="place-row"
                            onClick={() => moveTo(s)}
                            style={{ padding: "8px 6px" }}
                        >
                            <div className="place-left" style={{ gap: 10 }}>
                                <LocationIcon />
                                <div className="place-texts" style={{ maxWidth: 280 }}>
                                    <div className="place-label" style={{ fontWeight: 600, fontSize: "0.98rem", lineHeight: 1.25 }}>
                                        {name}
                                    </div>
                                    <div className="place-sub" style={{ fontSize: ".85rem" }}>
                                        {typeof s.distKm === "number" ? `${Math.round(s.distKm)} km` : ""}{typeof s.distKm === "number" && rest ? " • " : ""}{rest}
                                    </div>
                                </div>
                            </div>
                            <span className="more">⋯</span>
                        </button>
                    );
                })}
            </div>

            {searching && (
                <div className="search-panel">
                    {suggested.length === 0 ? (
                        <div className="empty">ไม่พบสถานที่</div>
                    ) : (
                        suggested.map((s, i) => {
                            const { name, rest } = splitLabel(s.label);
                            return (
                                <button
                                    key={`ov-${s.lat}-${s.lon}-${i}`}
                                    className="place-row overlay"
                                    onClick={() => moveTo(s)}
                                    style={{ padding: "12px 12px" }}
                                >
                                    <div className="place-left" style={{ gap: 10 }}>
                                        <LocationIcon />
                                        <div className="place-texts">
                                            <div className="place-label" style={{ fontWeight: 600, fontSize: "0.98rem" }}>
                                                {name}
                                            </div>
                                            <div className="place-sub" style={{ fontSize: ".85rem" }}>
                                                {typeof s.distKm === "number" ? `${Math.round(s.distKm)} km` : ""}{typeof s.distKm === "number" && rest ? " • " : ""}{rest}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            )}

            <div className="confirm-wrap">
                <button className="confirm-btn" onClick={confirm}>ยืนยันที่อยู่</button>
            </div>
        </div>
    );
}
