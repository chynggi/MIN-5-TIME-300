// Haversine 거리 계산 (미터 단위)
// 두 좌표 (위도, 경도) 사이의 거리를 반환
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // 지구 반지름 (m)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 특정 반경(m) 이내 여부
export function isWithinRadius(
  center: { lat: number; lng: number },
  target: { lat: number; lng: number },
  radiusMeters: number
) {
  return (
    haversineDistanceMeters(center.lat, center.lng, target.lat, target.lng) <=
    radiusMeters
  );
}
