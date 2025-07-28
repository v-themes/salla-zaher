export function setTranslations(ar, en) {
    return salla.lang.getLocale() == 'en' ? en : ar;
}

export function expiredStorage(key, value) {
    if (!key || !value) return;
    let now = new Date,
        expire_at = now.setDate(now.getDate() + 1);

    salla.storage.set(key, {
        data: value,
        expire_at: expire_at,
    });
}

export function checkLocalStorage(key) {
    const value = salla.storage.get(key);
    if (value == undefined || (value.expire_at && new Date(value.expire_at) <= new Date)) return false;
    return value.data;
}

export function getMobileOperatingSystem() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent)) return "Android";

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return "iOS";

    return "unknown";
}