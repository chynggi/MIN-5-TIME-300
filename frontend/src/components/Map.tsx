import { GoogleMap, Marker, Circle, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",
};

export interface DiaryPin {
  id: string;
  lat: number;
  lng: number;
  profileImageUrl?: string;
}

interface MapProps {
  pins: DiaryPin[];
}

export default function Map({ pins }: MapProps) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", // 환경변수에 키 필요
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setCenter({ lat: 37.5665, lng: 126.9780 }); // 기본값: 서울
        }
      );
    } else {
      setCenter({ lat: 37.5665, lng: 126.9780 });
    }
  }, []);

  if (!isLoaded || !center) return <div>지도를 불러오는 중...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
    >
      {/* 3km 반경 원 */}
      <Circle
        center={center}
        radius={3000}
        options={{
          fillColor: "#cce6ff",
          strokeColor: "#3399ff",
          fillOpacity: 0.2,
          strokeOpacity: 0.5,
        }}
      />
      {/* 내 위치 마커 */}
      <Marker position={center} label="내 위치" />
      {/* 공개 일기 마커 */}
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={{ lat: pin.lat, lng: pin.lng }}
          icon={pin.profileImageUrl ? {
            url: pin.profileImageUrl,
            scaledSize: new window.google.maps.Size(40, 40),
          } as google.maps.Icon : undefined}
        />
      ))}
    </GoogleMap>
  );
}
