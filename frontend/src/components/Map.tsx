"use client";
import { useEffect, useRef, useState } from "react";

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
  const mapRef = useRef<HTMLDivElement | null>(null);
  // 타입 정의가 없으므로 any로 참조 보관
  const naverMapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");

  // 지오코더 서브모듈이 없더라도 동적으로 로드하여 사용 가능하도록 보장
  const ensureGeocoderLoaded = async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    if (w.naver && w.naver.maps && w.naver.maps.Service) return;
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
    if (!clientId) throw new Error('NAVER MAPS clientId 누락');

    // 이미 지오코더 서브모듈 스크립트가 추가되었는지 확인
    const existing = document.querySelector('script[data-naver-geocoder="true"]') as HTMLScriptElement | null;
    if (existing) {
      // 로드 완료까지 대기
      await new Promise<void>((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          if (w.naver && w.naver.maps && w.naver.maps.Service) {
            resolve();
          } else if (Date.now() - start > 5000) {
            reject(new Error('지오코더 서브모듈 준비 시간 초과'));
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
      script.async = true;
      script.dataset.naverGeocoder = 'true';
      script.onload = () => {
        // 등록까지 한 틱 대기
        setTimeout(() => {
          if (w.naver && w.naver.maps && w.naver.maps.Service) resolve();
          else reject(new Error('지오코더 서브모듈 로드 실패'));
        }, 0);
      };
      script.onerror = () => reject(new Error('지오코더 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  };

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

  // Naver Maps 스크립트 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).naver && (window as any).naver.maps) {
      // 지도는 이미 로드됨. 지오코더가 없으면 서브모듈만 추가 로드 시도
      (async () => {
        try {
          if (!(window as any).naver.maps.Service) {
            await ensureGeocoderLoaded();
          }
        } catch (e) {
          // 지오코더가 없어도 지도 자체는 사용 가능하므로 로깅만
          console.warn('지오코더 서브모듈 로드 경고:', e);
        } finally {
          setIsLoaded(true);
        }
      })();
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
    if (!clientId) {
      console.warn('NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID 가 설정되어 있지 않습니다.');
      return;
    }
    const script = document.createElement('script');
    // geocoder 서브모듈 포함
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('Naver Maps 스크립트 로드 실패');
    document.head.appendChild(script);
    return () => {
      // 스크립트 정리는 생략 (다른 페이지에서도 재사용될 수 있음)
    };
  }, []);

  // 지도 초기화 및 업데이트
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !center) return;
    const { naver } = window as any;
    if (!naver || !naver.maps) return;
    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(center.lat, center.lng),
      zoom: 14,
    });
    naverMapRef.current = map;

    // 3km 반경 원
    new naver.maps.Circle({
      map,
      center: new naver.maps.LatLng(center.lat, center.lng),
      radius: 3000,
      fillColor: '#cce6ff',
      fillOpacity: 0.2,
      strokeColor: '#3399ff',
      strokeOpacity: 0.5,
      strokeWeight: 2,
    });

    // 내 위치 마커
    new naver.maps.Marker({
      position: new naver.maps.LatLng(center.lat, center.lng),
      map,
      icon: {
        content: `<div style="padding:2px 6px;background:#2563eb;color:#fff;border-radius:12px;font-size:12px;">내 위치</div>`,
        anchor: new naver.maps.Point(20, 20),
      } as any,
      title: '내 위치',
    });

    // 공개 일기 마커 + 정보창
    pins.forEach((pin) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(pin.lat, pin.lng),
        map,
        icon: {
          url: pin.profileImageUrl || '/default-profile.png',
          size: new naver.maps.Size(40, 40),
          origin: new naver.maps.Point(0, 0),
          anchor: new naver.maps.Point(20, 40),
        } as any,
        title: '공개 일기',
      });

      const infoContent = `
        <div class="p-2 max-w-xs">
          <div class="flex items-center gap-2 mb-2">
            <img src="${pin.profileImageUrl || '/default-profile.png'}" alt="프로필" class="w-8 h-8 rounded-full object-cover" />
            <span class="font-semibold text-sm">${pin.username || '익명'}</span>
          </div>
          <p class="text-xs text-gray-700">${pin.content || '일기 내용을 불러올 수 없습니다.'}</p>
          <button onclick="window.location.href='/community2/${pin.id}'" class="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">자세히 보기</button>
        </div>
      `;
      const infoWindow = new naver.maps.InfoWindow({
        content: infoContent,
        borderWidth: 0,
        backgroundColor: 'transparent',
        disableAnchor: true,
      });
      naver.maps.Event.addListener(marker, 'click', () => {
        infoWindow.open(map, marker);
      });
    });

    return () => {
      // naver 지도는 DOM을 비우면 자동 해제
    };
  }, [isLoaded, center, pins]);

  if (!isLoaded || !center) return <div>지도를 불러오는 중...</div>;
  // 지역 검색 실행 (geocoder)
  const runSearch = async () => {
    setSearchError("");
    if (!query.trim()) return;
    try {
      await ensureGeocoderLoaded();
    } catch (e: any) {
      setSearchError("지오코더를 사용할 수 없습니다. 관리자 설정(Naver Cloud 플랫폼의 도메인/앱 키/Geocoder 활성화)을 확인하세요.");
      return;
    }
    const { naver } = window as any;
    setSearching(true);
    try {
      await new Promise<void>((resolve, reject) => {
        naver.maps.Service.geocode({ query }, (status: any, response: any) => {
          if (status !== naver.maps.Service.Status.OK) {
            reject(new Error("검색 실패"));
            return;
          }
          const result = response?.v2?.addresses?.[0];
          if (!result) {
            reject(new Error("검색 결과가 없습니다."));
            return;
          }
          const lat = Number(result.y);
          const lng = Number(result.x);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setCenter({ lat, lng });
            resolve();
          } else {
            reject(new Error("좌표 변환 실패"));
          }
        });
      });
      setShowSearch(false);
    } catch (e: any) {
      setSearchError(e?.message || "검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  };

  // 현위치 이동
  const goToMyLocation = () => {
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("위치 서비스를 사용할 수 없습니다.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // 지도 즉시 이동 (가능하면 panTo), 상태도 업데이트하여 원/마커 갱신
        const { naver } = window as any;
        if (naver && naver.maps && naverMapRef.current) {
          naverMapRef.current.setCenter(new naver.maps.LatLng(lat, lng));
        }
        setCenter({ lat, lng });
        setLocLoading(false);
      },
      () => {
        setLocError("현위치를 가져오지 못했습니다.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div style={{ position: 'relative', ...containerStyle }}>
      {/* 지도 */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* 상단 좌측 지역 검색 버튼/패널 */}
      <div className="absolute left-2 top-2 z-10">
        {!showSearch ? (
          <button
            type="button"
            onClick={() => { setShowSearch(true); setSearchError(""); }}
            className="px-3 py-2 rounded bg-white shadow text-sm border hover:bg-gray-50"
          >
            지역 검색
          </button>
        ) : (
          <div className="p-2 bg-white rounded shadow border w-64 flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="지역/주소를 입력하세요"
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={searching}
              className="px-2 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
            >
              {searching ? '검색중' : '검색'}
            </button>
            <button
              type="button"
              onClick={() => { setShowSearch(false); setSearchError(""); }}
              className="px-2 py-1 rounded bg-gray-200 text-sm"
            >
              닫기
            </button>
          </div>
        )}
        {searchError && (
          <div className="mt-1 text-xs text-red-600 bg-white bg-opacity-90 rounded px-2 py-1 shadow">
            {searchError}
          </div>
        )}
      </div>

      {/* 상단 우측 현위치 버튼 */}
      <div className="absolute right-2 top-2 z-10 text-right">
        <button
          type="button"
          onClick={goToMyLocation}
          disabled={locLoading}
          className="px-3 py-2 rounded bg-white shadow text-sm border hover:bg-gray-50 disabled:opacity-60"
          aria-label="현위치로 이동"
          title="현위치로 이동"
        >
          {locLoading ? '이동 중...' : '현위치'}
        </button>
        {locError && (
          <div className="mt-1 text-xs text-red-600 bg-white bg-opacity-90 rounded px-2 py-1 shadow inline-block">
            {locError}
          </div>
        )}
      </div>
    </div>
  );
}
