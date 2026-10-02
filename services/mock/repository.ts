const KEY="rescuekaro_mock_state_v2";
export const mockRepository={load<T>(fallback:T):T{if(typeof window==="undefined")return fallback;try{return JSON.parse(localStorage.getItem(KEY)||"") as T}catch{return fallback}},save<T>(data:T){if(typeof window!=="undefined")localStorage.setItem(KEY,JSON.stringify(data))},clear(){if(typeof window!=="undefined")localStorage.removeItem(KEY)}};
