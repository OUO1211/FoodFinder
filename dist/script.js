"use strict";
/// <reference types="google.maps" />
// 地圖相關
let map = null;
let userLocation = null;
let searchCircle = null;
let restaurantMarkers = [];
let currentInfoWindow = null;
let lastSearchResults = [];
let wasmInitializedForCurrentResults = false; // 追蹤是否初始化過候選列表
// 專案配置與計數相關
const MAX_SEARCH_COUNT = 3;
const IS_LIMITED_VERSION = false;
let searchCount = MAX_SEARCH_COUNT;
let mapsApiLoaded = false;
let firstSearchTriggered = false;
// ==========================================================
// Phase 2: 載入與初始化
// ==========================================================
function initializeMapComponent() {
    if (map)
        return;
    const defaultLocation = { lat: 22.9970, lng: 120.2127 }; // [8]
    const mapElement = document.getElementById('map'); // [9]
    if (mapElement) { // [10]
        map = new google.maps.Map(mapElement, { center: defaultLocation, zoom: 15 }); // [11]
        mapElement.style.display = 'block';
    }
    getUserLocation(); // [12]
}
window.initMapPlaceholder = function () {
    mapsApiLoaded = true;
    if (firstSearchTriggered) {
        initializeMapComponent();
    }
    if (searchCount > 0) {
        runActualSearchLogic();
    }
};
function loadGoogleMapsApi() {
    if (mapsApiLoaded)
        return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAZ8eAF1CPtMCiiJDcLJU9D6bHp6iePUpA&libraries=places&callback=initMapPlaceholder`;
    script.async = true;
    document.head.appendChild(script);
}
// ==========================================================
// Phase 3: 定位與次數管理 (Cont.)
// ==========================================================
// 取得使用者位置
function getUserLocation() {
    const defaultLocation = { lat: 22.9970, lng: 120.2127 };
    userLocation = defaultLocation;
    // 標記預設位置 (使用 map! 斷言，因為它在 initializeMapComponent 後被呼叫)
    new google.maps.Marker({
        position: userLocation,
        map: map,
        title: '台南火車站(預設)'
    });
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
        // 成功回呼：參數需要強型別
        function (position) {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            // 地圖操作需要 map!
            map.setCenter(userLocation);
            // 標記使用者位置
            new google.maps.Marker({
                position: userLocation,
                map: map,
                title: '你的位置'
            });
        }, 
        // 失敗回呼：參數需要強型別
        function (error) {
            console.error('定位失敗, 使用台南預設座標', error);
        }, { enableHighAccuracy: true, timeout: 10000 });
    }
}
// ==========================================================
// Phase 4: 搜尋控制與執行 (Controller)
// ==========================================================
function searchRestaurants() {
    // 1. 檢查次數 (僅限於 LIMITED 版本)
    if (IS_LIMITED_VERSION && searchCount <= 0) {
        alert('搜尋次數已用完，無法執行搜尋！');
        return;
    }
    if (!mapsApiLoaded) {
        // 第一次點擊：觸發 API 載入 (非同步)
        firstSearchTriggered = true;
        loadGoogleMapsApi(); // ❌ 這裡會報錯：因為還沒定義
        alert('地圖 API 正在載入，請稍後再按一次搜尋！');
        return;
    }
    if (!map) {
        // API 已載入，但地圖未建立，立即初始化
        initializeMapComponent();
        return;
    }
    // API 和地圖都已準備好，執行搜尋
    runActualSearchLogic(); // ❌ 這裡會報錯：因為還沒定義
}
function drawSearchCircle(center, radius, mapInstance) {
    if (searchCircle) {
        searchCircle.setMap(null);
    }
    searchCircle = new google.maps.Circle({
        // 樣式設定
        strokeColor: '#FF0000', strokeOpacity: 0.8, strokeWeight: 2,
        fillColor: '#FF0000', fillOpacity: 0.15,
        // 幾何與位置設定
        map: mapInstance,
        center: center,
        radius: radius
    });
}
function handleSearchResults(
// 修正 1: results 必須允許 null
results, status, pagination) {
    // 核心邏輯修正：必須先檢查 results 是否為 null 或狀態不 OK
    if (results === null || status !== google.maps.places.PlacesServiceStatus.OK) {
        alert('搜尋失敗或無結果！');
        // 執行次數減少，即使失敗也要計算次數
        if (IS_LIMITED_VERSION) {
            searchCount--;
            localStorage.setItem('foodFinderSearchCount', searchCount.toString());
            updateCountDisplay();
        }
        return;
    }
    // 從這裡開始，results 確定是 Array<PlaceResult>
    // 1. 減少次數與顯示更新 (IS_LIMITED_VERSION 的邏輯)
    if (IS_LIMITED_VERSION) {
        searchCount--;
        localStorage.setItem('foodFinderSearchCount', searchCount.toString());
        updateCountDisplay();
    }
    // 現在可以安全地使用 results.length
    if (results.length === 0) {
        alert('附近沒有找到餐廳');
        return;
    }
    if (WasmSelector && results.length !== lastSearchResults.length) {
        console.log("搜尋結果數量改變，重新初始化候選索引。");
        WasmSelector._initialize(results.length);
        lastSearchResults = results;
    }
    let randomIndex;
    if (!wasmModuleLoaded || !WasmSelector) {
        console.warn("Wasm 模組未準備好，使用 JS 內建 Math.random()");
        randomIndex = Math.floor(Math.random() * results.length);
    }
    else {
        randomIndex = WasmSelector._getRandomIndex();
    }
    if (randomIndex === -1) {
        alert("本輪所有餐廳都已選過一次，請重新搜尋以獲取新的結果。");
        if (WasmSelector) {
            WasmSelector._initialize(results.length); // 重新初始化
        }
        return;
    }
    const restaurant = results[randomIndex];
    if (!restaurant) {
        console.error("隨機索引指向了無效的餐廳物件。");
        return;
    }
    map.setCenter(restaurant.geometry.location); // 確保 map 不為 null
    updateRestaurantMarkers(map, restaurant);
}
// ==========================================================
// Phase 3: 次數管理
// ==========================================================
// (這裡需要加入 initializeCount() 的定義，如果你還沒加的話)
// 更新顯示剩餘次數的函式
// ==========================================================
// Phase 3: 次數管理 (Cont.)
// ==========================================================
function initializeCount() {
    if (IS_LIMITED_VERSION) {
        const storedCount = localStorage.getItem('foodFinderSearchCount');
        if (storedCount === null || isNaN(parseInt(storedCount))) {
            searchCount = MAX_SEARCH_COUNT;
        }
        else {
            searchCount = parseInt(storedCount);
        }
    }
    else {
        searchCount = MAX_SEARCH_COUNT;
    }
}
function updateCountDisplay() {
    const countContainer = document.getElementById('countContainer');
    if (countContainer) { // 確保容器存在
        if (IS_LIMITED_VERSION) {
            countContainer.style.display = 'block';
            const countElement = document.getElementById('remainingCount');
            // 注意：要確保按鈕存在才能轉型
            const searchBtn = document.getElementById('searchBtn');
            if (countElement) {
                // 將數字轉為字串顯示
                countElement.textContent = searchCount.toString();
                if (searchCount <= 0) {
                    countElement.style.color = 'red';
                    if (searchBtn)
                        searchBtn.disabled = true;
                }
                else {
                    countElement.style.color = 'black';
                    if (searchBtn)
                        searchBtn.disabled = false;
                }
            }
        }
        else {
            countContainer.style.display = 'none'; // 無限制模式：隱藏容器
        }
    }
}
function runActualSearchLogic() {
    if (!userLocation) {
        alert('位置資訊尚未準備好，請稍後再試。');
        return;
    }
    if (!map) {
        alert('地圖元件尚未初始化');
        return;
    }
    const radiusInput = document.getElementById('radius');
    const radius = parseInt(radiusInput.value);
    drawSearchCircle(userLocation, radius, map);
    const request = {
        location: userLocation,
        radius: radius,
        type: 'restaurant'
    };
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, handleSearchResults);
}
function updateRestaurantMarkers(map, // 修正：地圖實例
restaurant // 修正：餐廳結果物件
) {
    // 1. 清除舊標記和 InfoWindow
    if (restaurantMarkers.length > 0) {
        restaurantMarkers.forEach(marker => marker.setMap(null));
        restaurantMarkers = [];
    }
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }
    const newMaker = new google.maps.Marker({
        position: restaurant.geometry.location, // 使用非空斷言
        map: map,
        title: restaurant.name || '未命名餐廳' // 使用邏輯 OR
    });
    const contentString = `<div style="padding: 5px;">... ${restaurant.name || '未命名'} ...</div>
                        <a href="https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}" target="_blank">網址</a>
                        <div style="padding: 5px;">... ${restaurant.business_status}...</div>`;
    // 4. 建立 InfoWindow 並設定互動
    const info = new google.maps.InfoWindow({
        content: contentString,
    });
    newMaker.addListener('click', () => info.open(map, newMaker));
    // 5. 自動彈出與儲存
    info.open(map, newMaker);
    currentInfoWindow = info;
    restaurantMarkers.push(newMaker);
}
window.onload = function () {
    // 1. 載入時先處理次數限制邏輯
    initializeCount();
    updateCountDisplay();
    // 2. 設定按鈕事件 (關鍵位置)
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchRestaurants);
    }
    // 3. 載入 Wasm 模組
    loadWasmModule();
};
//# sourceMappingURL=script.js.map