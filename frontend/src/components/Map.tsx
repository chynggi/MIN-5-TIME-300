import { GoogleMap, Marker, Circle, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
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
  content?: string;
  username?: string;
}

interface MapProps {
  pins: DiaryPin[];
}

export default function Map({ pins }: MapProps) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<DiaryPin | null>(null);
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
          icon={{
            url: pin.profileImageUrl || '/default-profile.png',
            scaledSize: new (window as any).google.maps.Size(40, 40),
            anchor: new (window as any).google.maps.Point(20, 40),
          }}
          title="공개 일기"
          onClick={() => setSelectedPin(pin)}
        />
      ))}
      
      {/* 선택된 Pin의 정보창 */}
      {selectedPin && (
        <InfoWindow
          position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
          onCloseClick={() => setSelectedPin(null)}
        >
          <div className="p-2 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={selectedPin.profileImageUrl || '/default-profile.png'} 
                alt="프로필"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="font-semibold text-sm">{selectedPin.username || '익명'}</span>
            </div>
            <p className="text-xs text-gray-700 line-clamp-3">
              {selectedPin.content || '일기 내용을 불러올 수 없습니다.'}
            </p>
            <button 
              onClick={() => window.location.href = `/community2/${selectedPin.id}`}
              className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              자세히 보기
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
