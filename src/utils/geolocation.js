/**
 * 浏览器/Electron 地理定位封装
 *
 * navigator.geolocation 返回的是 WGS84 坐标系；后端 DB 存的是 BD09。
 * 因此这里只负责采集原始 WGS84 坐标并标记 coordType，坐标系转换交由后端处理。
 *
 * 设计要点：
 * - 定位异步且可能弹授权框，发消息时不能阻塞，故采用「进页面预热 + 模块级缓存」策略：
 *   ensureGeolocation() 主动触发一次定位刷新缓存，getCachedLocation() 同步取缓存供发消息使用。
 * - 任何失败（不支持/拒绝授权/超时）一律静默返回 null，绝不阻断对话。
 */

// 模块级缓存：最近一次成功定位结果，形如 { lng, lat, coordType, accuracy, ts }
let cachedLocation = null

// 定位参数：开启高精度，超时 8s，允许复用 5 分钟内的系统缓存定位
const GEO_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 5 * 60 * 1000
}

/**
 * 主动触发一次定位并刷新缓存（用于进入对话页时预热授权）。
 * @returns {Promise<{lng:number, lat:number, coordType:string, accuracy:number, ts:number}|null>}
 *          成功返回定位对象，失败/不支持返回 null。
 */
export function ensureGeolocation() {
    return new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            // 环境不支持定位（理论上不会发生在 Chromium/Electron）
            resolve(null)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const {longitude, latitude, accuracy} = position.coords
                cachedLocation = {
                    lng: longitude,
                    lat: latitude,
                    coordType: 'wgs84',
                    accuracy,
                    ts: Date.now()
                }
                resolve(cachedLocation)
            },
            (error) => {
                // 拒绝授权 / 定位不可用 / 超时：静默失败，保留旧缓存（若有）
                console.warn(`[geolocation] 定位失败（code=${error.code}）：${error.message}`)
                resolve(null)
            },
            GEO_OPTIONS
        )
    })
}

/**
 * 同步获取缓存的定位结果，供发送消息时附带。
 * @returns {{lng:number, lat:number, coordType:string, accuracy:number, ts:number}|null}
 */
export function getCachedLocation() {
    return cachedLocation
}
