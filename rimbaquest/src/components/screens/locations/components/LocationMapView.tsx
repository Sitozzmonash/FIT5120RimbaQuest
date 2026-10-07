import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { CARTO_API_KEY } from '../../../../constants/config';
import { LocationItem } from '../../../../types';
import { CAMP_TENT_SVG, LOCATION_COLORS, MAP_PIN_SVG } from '../locationsTheme';

type MapMarker = { id: string; name: string; lat: number; lng: number };

export type LocationMapHandle = {
  // Zooms in on the "Your Camp" tent (the tent itself follows the userPosition prop).
  showUser: (latitude: number, longitude: number) => void;
};

const USER_ZOOM = 15;

// Leaflet page with CARTO tiles over OpenStreetMap data. Marker taps are posted
// back to React Native; `window.selectMarker(id)` highlights and pans to one,
// and `window.showUser(lat, lng)` puts the "Your Camp" tent at the device
// position and zooms to it.
function buildMapHtml(
  markers: MapMarker[],
  selectedId: string | null,
  topInset: number,
  bottomInset: number,
  user: { latitude: number; longitude: number } | null,
) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; background: #F2F2F0; }
  .pin { width: 36px; height: 36px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
    background: ${LOCATION_COLORS.pinBg}; box-shadow: 0 6px 6px rgba(0,0,0,0.1); transition: transform 0.15s; }
  .pin.active { background: ${LOCATION_COLORS.pinSelectedBg}; border: 3px solid ${LOCATION_COLORS.ink}; box-sizing: border-box; transform: scale(1.2); }
  .pin.active path { stroke: ${LOCATION_COLORS.ink}; }
  .camp { width: 44px; height: 44px; border-radius: 22px; display: flex; align-items: center; justify-content: center;
    background: ${LOCATION_COLORS.paper}; border: 3px solid ${LOCATION_COLORS.ink}; box-sizing: border-box;
    box-shadow: 0 4px 0 ${LOCATION_COLORS.ink}; }
  .camp svg { width: 26px; height: 24px; margin-top: -2px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var markers = ${JSON.stringify(markers)};
  var topInset = ${topInset};
  var bottomInset = ${bottomInset};
  var map = L.map('map', { zoomControl: false });
  // CARTO Positron: a muted light basemap so the pins stand out.
  L.tileLayer(${JSON.stringify(
    `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CARTO_API_KEY)}`,
  )}, {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  var layers = {};
  function icon(active) {
    return L.divIcon({
      className: '',
      html: '<div class="pin' + (active ? ' active' : '') + '">${MAP_PIN_SVG.replace(/'/g, "\\'")}</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  }
  function post(id) {
    var message = JSON.stringify({ type: 'select', id: id });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
    else window.parent.postMessage(message, '*');
  }
  // Pixel point that puts latlng in the middle of the strip between the overlays.
  function visibleCentre(latlng, zoom) {
    var point = map.project(latlng, zoom).add([0, (bottomInset - topInset) / 2]);
    return map.unproject(point, zoom);
  }

  var currentId = null;
  window.selectMarker = function (id) {
    if (currentId && layers[currentId]) layers[currentId].setIcon(icon(false)).setZIndexOffset(0);
    currentId = id;
    var layer = layers[id];
    if (!layer) return;
    layer.setIcon(icon(true)).setZIndexOffset(1000);
    focus = 'place';
    map.panTo(visibleCentre(layer.getLatLng(), map.getZoom()));
  };

  // What the view is centred on: 'user' after zooming to the camp, so a later
  // inset change keeps the camp in view instead of zooming back out.
  var focus = null;
  var focusZoom = null;
  var userMarker = null;
  function placeUser(lat, lng) {
    var latlng = L.latLng(lat, lng);
    var userIcon = L.divIcon({ className: '', html: '<div class="camp">${CAMP_TENT_SVG}</div>', iconSize: [44, 44], iconAnchor: [22, 22] });
    if (userMarker) userMarker.setLatLng(latlng);
    else userMarker = L.marker(latlng, { icon: userIcon, interactive: false, zIndexOffset: 2000 }).addTo(map);
    return latlng;
  }
  // Live update: move the tent; follow it only while the camp is in focus.
  window.moveUser = function (lat, lng) {
    var previous = userMarker ? userMarker.getLatLng() : null;
    var latlng = placeUser(lat, lng);
    // Only pan for real movement, so this never interrupts showUser's zoom.
    if (focus === 'user' && previous && !previous.equals(latlng)) {
      map.panTo(visibleCentre(latlng, map.getZoom()));
    }
  };
  window.removeUser = function () {
    if (userMarker) map.removeLayer(userMarker);
    userMarker = null;
    if (focus === 'user') focus = null;
  };
  window.showUser = function (lat, lng) {
    var latlng = placeUser(lat, lng);
    focus = 'user';
    var zoom = Math.max(map.getZoom(), ${USER_ZOOM});
    focusZoom = zoom;
    map.flyTo(visibleCentre(latlng, zoom), zoom, { duration: 0.8 });
  };

  markers.forEach(function (m) {
    var layer = L.marker([m.lat, m.lng], { icon: icon(false), title: m.name }).addTo(map);
    layer.on('click', function () { post(m.id); });
    layers[m.id] = layer;
  });

  function fitAll() {
    if (!markers.length) {
      // No coordinates to show: fall back to the Klang Valley.
      map.setView([3.139, 101.6869], 10);
      return;
    }
    var bounds = L.latLngBounds(markers.map(function (m) { return [m.lat, m.lng]; }));
    map.fitBounds(bounds, { paddingTopLeft: [32, 32 + topInset], paddingBottomRight: [32, 32 + bottomInset], maxZoom: 14 });
  }
  // Called when the overlays are measured or resized, without reloading the page.
  window.setInsets = function (top, bottom) {
    topInset = top;
    bottomInset = bottom;
    if (focus === 'user' && userMarker) {
      // Use the camp's target zoom: this can land mid-flight, and recentring at
      // the current zoom would cancel the zoom-in.
      map.setView(visibleCentre(userMarker.getLatLng(), focusZoom), focusZoom);
      return;
    }
    fitAll();
    if (currentId) window.selectMarker(currentId);
  };
  fitAll();
  // Restore the camp after a reload (e.g. a filter change), without zooming to it.
  var initialUser = ${JSON.stringify(user)};
  if (initialUser) placeUser(initialUser.latitude, initialUser.longitude);
  if (${JSON.stringify(selectedId)}) window.selectMarker(${JSON.stringify(selectedId)});
</script>
</body>
</html>`;
}

// Full-bleed Leaflet map; selection is owned by the parent so the place
// carousel and the pins stay in sync.
export const LocationMapView = forwardRef<LocationMapHandle, {
  locations: LocationItem[];
  selectedId: string | null;
  onSelectMarker: (id: string) => void;
  // Live device position for the camp tent (null hides it).
  userPosition?: { latitude: number; longitude: number } | null;
  // Heights of whatever overlays the top and bottom of the map, so pins stay visible.
  topInset?: number;
  bottomInset?: number;
}>(function LocationMapView({
  locations,
  selectedId,
  onSelectMarker,
  userPosition = null,
  topInset = 0,
  bottomInset = 0,
}, ref) {
  // Keyed on the set of places, not their order: re-sorting the cards by
  // distance must not reload the map (that would drop the camp and the zoom).
  const markersKey = useMemo(
    () =>
      JSON.stringify(
        locations
          .filter((item) => typeof item.lat === 'number' && typeof item.lng === 'number')
          .map((item) => ({ id: item.id, name: item.name, lat: item.lat as number, lng: item.lng as number }))
          .sort((left, right) => left.id.localeCompare(right.id)),
      ),
    [locations],
  );
  const userRef = useRef(userPosition);
  userRef.current = userPosition;
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const insetsRef = useRef({ topInset, bottomInset });
  insetsRef.current = { topInset, bottomInset };

  // Rebuild the page only when the marker set changes, not on every selection
  // or inset change (those are pushed in below).
  const html = useMemo(
    () =>
      buildMapHtml(
        JSON.parse(markersKey) as MapMarker[],
        selectedRef.current,
        insetsRef.current.topInset,
        insetsRef.current.bottomInset,
        userRef.current,
      ),
    [markersKey],
  );

  // Runs a snippet inside the map page (WebView on native, iframe on web).
  const runInMap = (script: string) => {
    if (Platform.OS === 'web') {
      const frameWindow = iframeRef.current?.contentWindow as (Window & { eval: (code: string) => unknown }) | null;
      frameWindow?.eval(script);
    } else {
      webViewRef.current?.injectJavaScript(`${script}; true;`);
    }
  };

  useEffect(() => {
    runInMap(`window.selectMarker && window.selectMarker(${JSON.stringify(selectedId)})`);
  }, [selectedId]);

  useEffect(() => {
    runInMap(`window.setInsets && window.setInsets(${Number(topInset)}, ${Number(bottomInset)})`);
  }, [topInset, bottomInset]);

  useEffect(() => {
    runInMap(
      userPosition
        ? `window.moveUser && window.moveUser(${Number(userPosition.latitude)}, ${Number(userPosition.longitude)})`
        : 'window.removeUser && window.removeUser()',
    );
  }, [userPosition?.latitude, userPosition?.longitude]);

  useImperativeHandle(ref, () => ({
    showUser: (latitude, longitude) => {
      runInMap(`window.showUser && window.showUser(${Number(latitude)}, ${Number(longitude)})`);
    },
  }));

  const handleMessage = (raw: unknown) => {
    if (typeof raw !== 'string') return;
    try {
      const message = JSON.parse(raw);
      if (message?.type === 'select' && typeof message.id === 'string') onSelectMarker(message.id);
    } catch {
      // Ignore messages that are not from the map.
    }
  };
  const handleMessageRef = useRef(handleMessage);
  handleMessageRef.current = handleMessage;

  // Web build: Leaflet runs in an iframe and posts marker taps to this window.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const listener = (event: MessageEvent) => handleMessageRef.current(event.data);
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return (
    <View style={styles.map} accessibilityLabel="Map showing matching wildlife locations">
      {Platform.OS === 'web' ? (
        React.createElement('iframe', {
          ref: iframeRef,
          srcDoc: html,
          title: 'Wildlife locations map',
          style: { width: '100%', height: '100%', border: 0 },
        })
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          // A real origin so the tile server receives a Referer with tile requests.
          source={{ html, baseUrl: 'https://rimbaquest.app/' }}
          onMessage={(event: WebViewMessageEvent) => handleMessage(event.nativeEvent.data)}
          style={styles.webView}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F2F2F0' },
  webView: { flex: 1, backgroundColor: '#F2F2F0' },
});
