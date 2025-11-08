// ==========================================================
// Phase 1: 全域變數與配置
// ==========================================================
let map;
let userLocation = null; // 確保初始為 null，以等待定位或使用預設
let searchCircle = null;
let restaurantMarkers = [];
let currentInfoWindow = null;

// ****** 配置與限制 ******
const IS_LIMITED_VERSION = true; // true: 限制次數 (最終版本) | false: 無限制 (測試版本)
const MAX_SEARCH_COUNT = 3; 
let searchCount = MAX_SEARCH_COUNT; 
let mapsApiLoaded = false;
let firstSearchTriggered = false; // 追蹤首次點擊，用於觸發 API 載入

// 設置 API 載入完成後的回呼函式
window.initMapPlaceholder = function() {
    mapsApiLoaded = true;
    console.log("Google Maps API 載入完成，可以開始初始化地圖了。");
    
    // 如果使用者已經點擊過，API 載入完畢後就立即初始化地圖
    if (firstSearchTriggered) {
        initializeMapComponent();
        // 初始化後，如果次數足夠，就可以執行搜尋了
        if (searchCount > 0) {
             runActualSearchLogic();
        }
    }
};


// ==========================================================
// Phase 2: 載入與初始化 (Lazy Loading 核心)
// ==========================================================

function loadGoogleMapsApi() {
    if (mapsApiLoaded) return; // 防止重複載入

    // 建立一個 script 標籤並開始載入 API
    const script = document.createElement('script');
    // 請將 YOUR_API_KEY 替換為你的實際金鑰
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAZ8eAF1CPtMCiiJDcLJU9D6bHp6iePUpA&libraries=places&callback=initMapPlaceholder`; 
    script.async = true;
    document.head.appendChild(script);
}

// 初始化地圖元件
function initializeMapComponent() {
    if (map) return; // 防止重複建立地圖

    const defaultLocation = { lat: 22.9970, lng: 120.2127 }; // 台南火車站
    
    // 建立地圖
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 15
    });
    
    // 顯示地圖容器（如果有初始隱藏的樣式）
    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.style.display = 'block'; 
    }

    // 取得使用者位置 (定位是非同步的，但在這之後 userLocation 就會有最終值)
    getUserLocation(); 
}

// ==========================================================
// Phase 3: 定位與次數管理
// ==========================================================

// 從 Local Storage 讀取或初始化次數
function initializeCount() {
    if (IS_LIMITED_VERSION) {
        const storedCount = localStorage.getItem('foodFinderSearchCount'); 
        
        if (storedCount === null || isNaN(parseInt(storedCount))) {
            searchCount = MAX_SEARCH_COUNT;
        } else {
            searchCount = parseInt(storedCount); 
        }
    }
}

// 更新顯示剩餘次數的函式
function updateCountDisplay() {
    const countContainer = document.getElementById('countContainer'); 

    if (countContainer) {
        if (IS_LIMITED_VERSION) {
            countContainer.style.display = 'block'; // 限制模式：顯示容器
            
            const countElement = document.getElementById('remainingCount');
            if (countElement) {
                countElement.textContent = searchCount;
                
                // 禁用按鈕和樣式控制
                const searchBtn = document.getElementById('searchBtn');
                if (searchCount <= 0) {
                    countElement.style.color = 'red';
                    if (searchBtn) searchBtn.disabled = true;
                } else {
                    countElement.style.color = 'black';
                    if (searchBtn) searchBtn.disabled = false;
                }
            }
        } else {
            countContainer.style.display = 'none'; // 無限制模式：隱藏容器
        }
    }
}

// 取得使用者位置
function getUserLocation() {
    const defaultLocation = { lat: 22.9970, lng: 120.2127 }; // 台南火車站

    // 先設定預設位置
    userLocation = defaultLocation; 
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                // 成功取得座標，更新 userLocation
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLocation);
                // 標記使用者位置
                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: '你的位置'
                });
            },
            function(error) {
                console.error('定位失敗, 使用台南預設座標');
                // 標記預設位置
                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: '台南火車站(預設)'
                });
            }
        );
    }
}

// ==========================================================
// Phase 4: 搜尋控制與執行
// ==========================================================

// 搜尋餐廳 (控制流程)
function searchRestaurants() {
    // 檢查次數 (僅限於 LIMITED 版本)
    if (IS_LIMITED_VERSION && searchCount <= 0) {
        alert('搜尋次數已用完，無法執行搜尋！');
        return; 
    }

    if (!mapsApiLoaded) {
        // 第一次點擊：觸發 API 載入
        firstSearchTriggered = true; 
        loadGoogleMapsApi(); 
        alert('地圖 API 正在載入，請稍後再按一次搜尋！');
        return;
    }
    
    if (!map) {
        // 第二次點擊：API 已載入，但地圖未建立，立即初始化
        initializeMapComponent();
        return; 
    }
    
    // API 和地圖都已準備好，執行搜尋
    runActualSearchLogic();
}


// 實際執行搜尋、畫圓、呼叫 Places API 的函式
function runActualSearchLogic() {
    if (!userLocation) {
        alert('位置資訊尚未準備好，請稍後再試。');
        return;
    }

    const radius = parseInt(document.getElementById('radius').value);

    // 1. 清除舊圓形並繪製新圓形
    if (searchCircle) { 
        searchCircle.setMap(null); 
    }
    searchCircle = new google.maps.Circle({
        strokeColor: '#FF0000', strokeOpacity: 0.8, strokeWeight: 2,
        fillColor: '#FF0000', fillOpacity: 0.15, 
        map: map, center: userLocation, radius: radius
    });

    // 2. 建立搜尋請求
    const request = {
        location: userLocation,
        radius: radius,
        type: 'restaurant'
    };
    
    // 3. 執行搜尋
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, handleSearchResults);
}

// ==========================================================
// Phase 5: 處理結果與標記
// ==========================================================

function handleSearchResults(results, status) {
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
        alert('搜尋失敗，請重試！');
        return;
    }

    // 1. 減少次數 (只在 LIMITED 版本中執行)
    if (IS_LIMITED_VERSION) {
        searchCount--;
        localStorage.setItem('foodFinderSearchCount', searchCount); // 存入硬碟
        updateCountDisplay(); 
    }
    
    if (results.length === 0) {
        alert('附近沒有找到餐廳');
        return;
    }
    
    // 2. 隨機選擇餐廳
    const randomIndex = Math.floor(Math.random() * results.length);
    const restaurant = results[randomIndex];
    map.setCenter(restaurant.geometry.location);

    // 3. 繪製標記與 InfoWindow
    updateRestaurantMarkers(map, restaurant);
}

function updateRestaurantMarkers(map, restaurant) {
    // 1. 清除舊標記和 InfoWindow
    if(restaurantMarkers.length > 0){
        restaurantMarkers.forEach(marker => marker.setMap(null));
        restaurantMarkers = [];
    }
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }

    // 2. 建立新標記
    const newMaker = new google.maps.Marker({
        position: restaurant.geometry.location,
        map: map,
        title: restaurant.name  
    });
    
    // 3. 準備 InfoWindow 內容 (優化版本)
    const contentString = `
        <div style="padding: 5px; max-width: 250px;">
            <h4 style="margin: 0 0 5px 0; color: #333;">${restaurant.name}</h4>
            <p style="margin: 0;"><strong>評分:</strong> ${restaurant.rating || '暫無'} (${restaurant.user_rating_count || 0} 則評論)</p>
            <p style="margin: 5px 0 0 0;"><strong>地址:</strong> ${restaurant.vicinity || '無法取得簡略地址'}</p>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.place_id}" 
               target="_blank" style="display: block; margin-top: 10px; color: blue;">
               查看 Google Maps 詳細資訊
            </a>
        </div>
    `;

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

// ==========================================================
// Phase 6: 啟動 (Entry Point)
// ==========================================================

window.onload = function() {
    // 1. 載入時先處理次數限制邏輯
    initializeCount();
    updateCountDisplay();
    
    // 2. 不自動執行地圖初始化 (Lazy Loading)
    
    // 3. 設定按鈕事件
    document.getElementById('searchBtn').addEventListener('click', searchRestaurants);
};

// --------------------------------------------------------------------------------
// 測試工具：在 Console 中輸入 localStorage.clear() 即可清除次數限制
// --------------------------------------------------------------------------------