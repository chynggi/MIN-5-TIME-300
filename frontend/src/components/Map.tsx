"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';

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
  profileColor?: string | null;
}

interface MapProps {
  pins: DiaryPin[];
}

export default function Map({ pins }: MapProps) {
  const router = useRouter();
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울
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
  // 지오로케이션 요청 식별 (Whale 등에서 비동기 race로 성공 후 에러 잔류 방지)
  const geoRequestIdRef = useRef(0);
  const lastSuccessIdRef = useRef(0);

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

  // 초기 자동 위치 요청: 권한이 이미 granted 일 때만 수행 (중복 prompt 방지)
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      // Permissions API 지원 여부 확인
      try {
        if (navigator.permissions?.query) {
          const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (pos) => { if (!cancelled) setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
              () => { if (!cancelled) setCenter(DEFAULT_CENTER); }
            );
            return;
          }
          // prompt or denied 이면 사용자 상호작용(버튼)까지 대기
          if (!cancelled) setCenter(DEFAULT_CENTER);
        } else {
          // Permissions API 미지원 → 기존 로직 (시도 후 실패 시 기본값)
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => { if (!cancelled) setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
              () => { if (!cancelled) setCenter(DEFAULT_CENTER); }
            );
          } else if (!cancelled) {
            setCenter(DEFAULT_CENTER);
          }
        }
      } catch (e) {
        if (!cancelled) setCenter(DEFAULT_CENTER);
      }
    };
    init();
    return () => { cancelled = true; };
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
  // geocoder 서브모듈 포함 (공식 파라미터명: ncpClientId)
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
    // 현재 열린 InfoWindow 추적 및 지도 클릭 시 닫기 로직 추가
  let openInfoWindow: any = null;
  let openInfoWindowMarker: any = null; // 현재 열린 창의 마커
  let suppressMapClickClose = false; // 마커 클릭 직후 1틱 방어
  let lastInfoWindowRoot: HTMLElement | null = null; // 현재 열린 InfoWindow DOM root

    // 지도 클릭하면 열린 창 닫기 (마커 클릭으로 열린 직후엔 1틱 suppress)
    naver.maps.Event.addListener(map, 'click', (e: any) => {
      // 클릭 지점이 InfoWindow 내부라면 닫지 않음
      if (lastInfoWindowRoot && e?.domEvent?.target) {
        const tgt = e.domEvent.target as HTMLElement;
        if (lastInfoWindowRoot.contains(tgt)) return;
      }
      if (suppressMapClickClose) {
        suppressMapClickClose = false;
        return;
      }
      if (openInfoWindow) {
        openInfoWindow.close();
        openInfoWindow = null;
        openInfoWindowMarker = null;
        lastInfoWindowRoot = null;
        document.body.classList.remove('map-infowindow-open');
      }
    });

    pins.forEach((pin) => {
      // 프로필 이미지를 동그랗게 보이도록 HTML content 기반 커스텀 마커 사용
      // (기존 url 기반 MarkerImage 는 배경/투명 처리 문제로 흰 박스로 보이는 이슈 발생)
      const markerSize = 44; // 외곽 포함 px
      const avatarSize = 40; // 실제 이미지 영역
      const profileUrl = pin.profileImageUrl || '/default-profile.jpg';
      const markerHtml = `
        <div style="width:${markerSize}px;height:${markerSize}px;display:flex;align-items:center;justify-content:center;position:relative;">
          <div style="width:${avatarSize}px;height:${avatarSize}px;border-radius:50%;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid #ffffff;background:#f2f2f2;">
            <img src="${profileUrl}" alt="프로필" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'" />
          </div>
          <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:10px;height:10px;background:rgba(0,0,0,0.35);filter:blur(4px);border-radius:50%;"></div>
        </div>`;

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(pin.lat, pin.lng),
        map,
        icon: {
          content: markerHtml,
          size: new naver.maps.Size(markerSize, markerSize),
          anchor: new naver.maps.Point(markerSize / 2, markerSize / 2),
        } as any,
        title: pin.username ? `${pin.username}님의 공개 일기` : '공개 일기',
        clickable: true,
      });

      const truncated = (pin.content || '일기 내용을 불러올 수 없습니다.')
        .replace(/\n+/g,' ')
        .slice(0, 80) + ((pin.content || '').length > 80 ? '…' : '');

      // profileColor가 유효한 hex 혹은 rgb 형식인지 간단 검증 (미흡하면 흰색 fallback)
      const rawColor = (pin.profileColor || '').trim();
      const validColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(rawColor)
        ? rawColor
        : (/^rgba?\(/.test(rawColor) ? rawColor : '#ffffff');
      // 대비 텍스트 색상 계산 (hex 3/6 지원)
      let textColor = '#111111';
      try {
        let r: number, g: number, b: number;
        if (validColor.startsWith('#')) {
          const hex = validColor.substring(1);
          if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
          } else {
            r = parseInt(hex.substring(0,2), 16);
            g = parseInt(hex.substring(2,4), 16);
            b = parseInt(hex.substring(4,6), 16);
          }
        } else {
          // rgb/rgba 추출
            const m = validColor.match(/rgba?\(([^)]+)\)/);
            if (m) {
              const parts = m[1].split(',').map(p=>parseInt(p.trim(),10));
              r = parts[0]; g = parts[1]; b = parts[2];
            } else { r=g=b=255; }
        }
        // WCAG luminance 기반 대비(단순)
        const luminance = (0.2126*r + 0.7152*g + 0.0722*b)/255;
        textColor = luminance > 0.6 ? '#111111' : '#ffffff';
      } catch { /* fallback 유지 */ }

      const infoContent = `
        <div class="relative shadow-lg rounded-xl overflow-hidden max-w-[150px] border border-gray-200 backdrop-blur-sm select-none"
             style="background:${validColor};">
          <div class="p-3 flex flex-col items-center gap-2">
            <div class="relative">
              <img src="${pin.profileImageUrl || '/default-profile.jpg'}" alt="프로필" class="w-14 h-14 rounded-full object-cover ring-2 ring-white/40" />
            </div>
            <div class="w-full text-center">
              <div class="font-medium text-xs break-all leading-snug" style="color:${textColor};">${pin.username || '익명'}</div>
            </div>
          </div>
        </div>
      `;
      const infoWindow = new naver.maps.InfoWindow({
        content: infoContent,
        borderWidth: 0,
        backgroundColor: 'transparent',
        disableAnchor: true,
      });
      naver.maps.Event.addListener(marker, 'click', () => {
        suppressMapClickClose = true; // 바로 뒤 map click 으로 닫히지 않도록
        // 동일 마커 재클릭 → 토글 닫기
        if (openInfoWindow && openInfoWindow === infoWindow && openInfoWindowMarker === marker) {
          openInfoWindow.close();
          openInfoWindow = null;
          openInfoWindowMarker = null;
          lastInfoWindowRoot = null;
          document.body.classList.remove('map-infowindow-open');
          return;
        }
        if (openInfoWindow && openInfoWindow !== infoWindow) {
          openInfoWindow.close();
        }
        infoWindow.open(map, marker);
        openInfoWindow = infoWindow;
        openInfoWindowMarker = marker;
        document.body.classList.add('map-infowindow-open');
      });

      // InfoWindow DOM 이 준비되면 a 태그에 SPA 내비게이션 바인딩
      naver.maps.Event.addListener(infoWindow, 'domready', () => {
        const el = infoWindow.getElement && infoWindow.getElement();
        if (!el) return;
        lastInfoWindowRoot = el as HTMLElement;
        if (!el.dataset.infowindowRoot) el.dataset.infowindowRoot = '1';
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
    const requestId = ++geoRequestIdRef.current;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // 오래된 요청이면 무시
        if (requestId < geoRequestIdRef.current) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const { naver } = window as any;
        if (naver && naver.maps && naverMapRef.current) {
          naverMapRef.current.setCenter(new naver.maps.LatLng(lat, lng));
        }
        setCenter({ lat, lng });
        lastSuccessIdRef.current = requestId;
        // 성공 시 에러 메시지 확실히 제거
        setLocError("");
        setLocLoading(false);
      },
      (err) => {
        (async () => {
          // 더 최신 요청이 이미 진행 중이라면 이 에러는 무시
          if (requestId < geoRequestIdRef.current && lastSuccessIdRef.current >= geoRequestIdRef.current) return;
          let msg = "현재 위치를 불러오지 못했습니다.";
          // Permissions API를 통해 실제 상태 재확인
          try {
            if (navigator.permissions && (navigator.permissions as any).query) {
              const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
              if (status.state === 'denied') {
                msg = "브라우저 위치 권한이 차단되었습니다. 사이트 권한 설정에서 '위치'를 허용 후 다시 시도하세요.";
              } else if (status.state === 'prompt' && err?.code === 1) {
                msg = "위치 사용 요청이 취소되었거나 허용되지 않았습니다. 다시 시도하여 권한을 허용해주세요.";
              }
            }
          } catch (e) {
            // Permissions API 미지원 or 실패는 무시
          }

          if (err?.code === 2) {
            msg = "위치 센서 또는 네트워크 정보를 확인할 수 없습니다. (GPS 비활성화/실내/에뮬레이터 가능성)";
          } else if (err?.code === 3) {
            msg = "위치 응답이 지연되었습니다. 네트워크나 GPS 상태를 확인 후 다시 시도하세요.";
          }
          // 개발자 콘솔에 상세 로그
          console.warn('[Geolocation error]', err);
          setLocError(msg);
          setLocLoading(false);
        })();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  return (
    <div style={{ position: 'relative', ...containerStyle }}>
      {/* body lock 시 안내용 (선택적으로 스타일 할 수 있음) */}
      <style>{`
        body.map-infowindow-open { overscroll-behavior: contain; touch-action: none; }
        @media (max-width: 768px) {
          body.map-infowindow-open { position: fixed; width:100%; }
        }
      `}</style>
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
