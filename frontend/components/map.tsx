/// <reference types="@types/navermaps" />

import { useEffect, useRef } from "react";
// Removed import as naver is globally available

interface MapProps {
  center: { lat: number; lng: number };
  zoom: number;
}

export default function Map({ center, zoom }: MapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const initializeMap = () => {
      if (mapRef.current && window.naver) {
        const map = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(center.lat, center.lng),
          zoom,
        });

        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(center.lat, center.lng),
          map,
        });
      }
    };

    const loadNaverMapsScript = () => {
      const script = document.createElement("script");
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=1yz0vpsnbr`;
      script.async = true;
      script.onload = initializeMap;
      document.body.appendChild(script);
    };

    if (!window.naver) {
      loadNaverMapsScript();
    } else {
      initializeMap();
    }
  }, [center, zoom]);

  return (
    <div
      ref={mapRef}
      className="max-w-md md:max-w-screen-lg mx-auto"
      style={{ width: "100%", height: "400px" }}
    />
  );
}