"use strict";
var WasmSelector = null;
var wasmModuleLoaded = false;
const REQUIRED_SECRET = "alex2357111317"; // ⚠️ 定義你的秘密金鑰
const urlParams = new URLSearchParams(window.location.search);
const userKey = urlParams.get('key'); // 從 URL 取得 'key' 參數的值
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// 只有當「不是在本地運行」 AND 「密鑰不匹配」時，才阻擋存取。
if (!isLocalhost && userKey !== REQUIRED_SECRET) {
    // 如果金鑰不匹配，則阻止應用程式運行
    document.body.innerHTML = '<div style="margin: 50px; text-align: center;"><h1>ACCESS DENIED</h1><p>請確認您的存取金鑰。</p></div>';
    throw new Error("Unauthorized Access: Missing or invalid secret key.");
}
function loadWasmModule() {
    // WASM loader 在 src/random_selector.js
    const script = document.createElement('script');
    script.src = './src/random_selector.js';
    document.head.appendChild(script);
}
// Emscripten 會尋找這個全域 Module 物件
var Module = {
    // 當 Wasm 執行環境初始化完成時，這個回呼會被觸發
    onRuntimeInitialized: function () {
        console.log("WebAssembly 隨機選擇模組載入完成。");
        wasmModuleLoaded = true;
        WasmSelector = Module; // 將 Module 儲存起來供其他函式使用
    },
    // 這是為了幫助 Wasm 載入器找到 .wasm 檔案
    locateFile: function (path, prefix) {
        if (path.endsWith('.wasm')) {
            // .wasm 檔案在 src/ 資料夾
            return './src/' + path;
        }
        return path;
    }
};
//# sourceMappingURL=app.js.map