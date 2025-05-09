/// <reference types="@types/navermaps" />

import { useEffect, useRef } from "react";

interface MapProps {
  center: { lat: number; lng: number };
  zoom: number;
}

export default function Map({ center, zoom }: MapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const initializeMap = () => {
      if (mapRef.current) {
        const map = new naver.maps.Map(mapRef.current, {
          center: new naver.maps.LatLng(center.lat, center.lng),
          zoom,
        });

        // Example marker
        new naver.maps.Marker({
          position: new naver.maps.LatLng(center.lat, center.lng),
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

  return <div ref={mapRef} style={{ width: "100%", height: "400px" }} />;
}