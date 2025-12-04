interface WasmModule {
    _initialize(count: number): void;
    _getRandomIndex(): number;
}
declare function loadWasmModule(): void;
interface Window {
    initMapPlaceholder: () => void;
}
declare let map: google.maps.Map | null;
declare let userLocation: google.maps.LatLngLiteral | null;
declare let searchCircle: google.maps.Circle | null;
declare let restaurantMarkers: Array<google.maps.Marker>;
declare let currentInfoWindow: google.maps.InfoWindow | null;
declare var wasmModuleLoaded: boolean;
declare var WasmSelector: any;
declare let lastSearchResults: Array<google.maps.places.PlaceResult>;
declare let wasmInitializedForCurrentResults: boolean;
declare const MAX_SEARCH_COUNT: number;
declare const IS_LIMITED_VERSION: boolean;
declare let searchCount: number;
declare let mapsApiLoaded: boolean;
declare let firstSearchTriggered: boolean;
declare function initializeMapComponent(): void;
declare function loadGoogleMapsApi(): void;
declare function getUserLocation(): void;
declare function searchRestaurants(): void;
declare function drawSearchCircle(center: google.maps.LatLngLiteral, radius: number, mapInstance: google.maps.Map): void;
declare function handleSearchResults(results: Array<google.maps.places.PlaceResult> | null, status: google.maps.places.PlacesServiceStatus, pagination: google.maps.places.PlaceSearchPagination | null): void;
declare function initializeCount(): void;
declare function updateCountDisplay(): void;
declare function runActualSearchLogic(): void;
declare function updateRestaurantMarkers(map: google.maps.Map, // 修正：地圖實例
restaurant: google.maps.places.PlaceResult): void;
//# sourceMappingURL=script.d.ts.map