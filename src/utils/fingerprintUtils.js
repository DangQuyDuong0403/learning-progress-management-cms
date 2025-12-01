/**
 * Utility để thu thập và hash fingerprint của thiết bị
 * Mục đích: Phát hiện và ngăn chặn việc thi hộ (nhiều người cùng dùng 1 account)
 */

/**
 * Secret key (raw string) để tăng tính bảo mật cho fingerprint hash.
 * - Giá trị ưu tiên lấy từ biến môi trường REACT_APP_DEVICE_FINGERPRINT_SECRET
 * - Nếu chưa cấu hình env, sử dụng fallback UID cố định (nên thay bằng giá trị riêng của bạn)
 */
const FINGERPRINT_SECRET_KEY =process.env.REACT_APP_DEVICE_FINGERPRINT_SECRET;

/**
 * Lấy IP address từ API bên thứ ba
 * @returns {Promise<string>} IP address hoặc 'unknown' nếu không lấy được
 */
export const getIPAddress = async () => {
  // Sử dụng nhiều API để tăng độ tin cậy
  const ipAPIs = [
    'https://api.ipify.org?format=json',
    'https://api.ipapi.com/api/check?access_key=free', // Free tier, không cần key
    'https://ipapi.co/json/',
    'https://api.myip.com',
  ];

  for (const apiUrl of ipAPIs) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout 5 giây

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      
      // Xử lý các format khác nhau của API
      if (data.ip) {
        return data.ip;
      } else if (data.query) {
        return data.query;
      } else if (data.origin) {
        return data.origin;
      }
    } catch (error) {
      // Thử API tiếp theo nếu lỗi
      console.warn(`Không thể lấy IP từ ${apiUrl}:`, error.message);
      continue;
    }
  }

  // Fallback: Thử WebRTC để lấy local IP (nếu có)
  try {
    const localIP = await getLocalIP();
    if (localIP) {
      return localIP;
    }
  } catch (e) {
    console.warn('Không thể lấy local IP:', e);
  }

  return 'unknown';
};

/**
 * Lấy local IP address bằng WebRTC (nếu có)
 * @returns {Promise<string|null>} Local IP hoặc null
 */
const getLocalIP = () => {
  return new Promise((resolve) => {
    const RTCPeerConnection = window.RTCPeerConnection || 
                              window.mozRTCPeerConnection || 
                              window.webkitRTCPeerConnection;

    if (!RTCPeerConnection) {
      resolve(null);
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.createDataChannel('');
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (match) {
          const ip = match[1];
          // Chỉ lấy IP private (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
          if (ip.startsWith('192.168.') || 
              ip.startsWith('10.') || 
              /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) {
            pc.close();
            resolve(ip);
            return;
          }
        }
      }
    };

    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(() => resolve(null));

    // Timeout sau 3 giây
    setTimeout(() => {
      pc.close();
      resolve(null);
    }, 3000);
  });
};

/**
 * Thu thập thông tin fingerprint từ browser
 * @returns {Promise<Object>} Object chứa các thông tin fingerprint
 */
export const collectFingerprint = async () => {
  // Lấy IP address
  const ipAddress = await getIPAddress();

  const fingerprint = {
    // Thông tin IP
    ipAddress: ipAddress,
    
    // Thông tin cơ bản
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages?.join(',') || '',
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || 'unknown',
    
    // Thông tin màn hình
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenColorDepth: window.screen.colorDepth,
    screenPixelDepth: window.screen.pixelDepth,
    screenAvailWidth: window.screen.availWidth,
    screenAvailHeight: window.screen.availHeight,
    
    // Thông tin window
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    
    // Thông tin timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // Thông tin hardware
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: navigator.deviceMemory || 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    
    // Thông tin WebGL
    webglVendor: '',
    webglRenderer: '',
    
    // Canvas fingerprint
    canvasHash: '',
    
    // Audio fingerprint
    audioHash: '',
    
    // Thông tin bổ sung
    sessionStorage: typeof Storage !== 'undefined' && !!window.sessionStorage,
    localStorage: typeof Storage !== 'undefined' && !!window.localStorage,
    indexedDB: !!window.indexedDB,
    webdriver: navigator.webdriver || false,
  };

  // Thu thập WebGL fingerprint
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        fingerprint.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        fingerprint.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {
    console.warn('Không thể thu thập WebGL fingerprint:', e);
  }

  // Thu thập Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Fingerprint test 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Fingerprint test 🔒', 4, 17);
      
      fingerprint.canvasHash = canvas.toDataURL();
    }
  } catch (e) {
    console.warn('Không thể thu thập Canvas fingerprint:', e);
  }

  // Thu thập Audio fingerprint (async)
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    gainNode.gain.value = 0; // Mute để không phát ra âm thanh
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(0);

    scriptProcessor.onaudioprocess = (event) => {
      const output = event.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < output.length; i++) {
        sum += Math.abs(output[i]);
      }
      fingerprint.audioHash = sum.toString();
      oscillator.stop();
      audioContext.close();
    };
  } catch (e) {
    console.warn('Không thể thu thập Audio fingerprint:', e);
  }

  return fingerprint;
};

/**
 * Tạo chuỗi fingerprint từ object
 * @param {Object} fingerprint - Object chứa thông tin fingerprint
 * @returns {string} Chuỗi fingerprint
 */
export const createFingerprintString = (fingerprint) => {
  // Sắp xếp và tạo chuỗi từ các giá trị quan trọng
  const components = [
    fingerprint.ipAddress, // Thêm IP vào đầu để dễ nhận biết
    fingerprint.userAgent,
    fingerprint.platform,
    fingerprint.screenWidth + 'x' + fingerprint.screenHeight,
    fingerprint.screenColorDepth,
    fingerprint.devicePixelRatio,
    fingerprint.timezone,
    fingerprint.timezoneOffset,
    fingerprint.hardwareConcurrency,
    fingerprint.deviceMemory,
    fingerprint.maxTouchPoints,
    fingerprint.webglVendor,
    fingerprint.webglRenderer,
    fingerprint.canvasHash ? fingerprint.canvasHash.substring(0, 100) : '', // Lấy một phần để tránh quá dài
    fingerprint.audioHash,
    fingerprint.sessionStorage,
    fingerprint.localStorage,
    fingerprint.indexedDB,
    fingerprint.webdriver,
    FINGERPRINT_SECRET_KEY, // Thêm secret key để khó giả mạo fingerprint
  ];

  return components.join('|');
};

/**
 * Hash fingerprint string bằng SHA-256
 * @param {string} fingerprintString - Chuỗi fingerprint
 * @returns {Promise<string>} Hash SHA-256 của fingerprint
 */
export const hashFingerprint = async (fingerprintString) => {
  try {
    // Sử dụng Web Crypto API để hash
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Lỗi khi hash fingerprint:', error);
    // Fallback: sử dụng một hash đơn giản nếu Web Crypto API không khả dụng
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
};

/**
 * Lấy fingerprint và hash của thiết bị hiện tại
 * @returns {Promise<{fingerprint: Object, fingerprintString: string, hash: string}>}
 */
export const getDeviceFingerprint = async () => {
  const fingerprint = await collectFingerprint();
  const fingerprintString = createFingerprintString(fingerprint);
  const hash = await hashFingerprint(fingerprintString);

  return {
    fingerprint,
    fingerprintString,
    hash,
  };
};

/**
 * Lưu fingerprint hash vào localStorage
 * @param {string} hash - Hash của fingerprint
 * @param {string} key - Key để lưu (mặc định: 'deviceFingerprint')
 */
export const saveFingerprintHash = (hash, key = 'deviceFingerprint') => {
  try {
    const data = {
      hash,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Lỗi khi lưu fingerprint:', error);
    return false;
  }
};

/**
 * Lấy fingerprint hash đã lưu từ localStorage
 * @param {string} key - Key để lấy (mặc định: 'deviceFingerprint')
 * @returns {Object|null} Object chứa hash và timestamp, hoặc null nếu không tìm thấy
 */
export const getSavedFingerprintHash = (key = 'deviceFingerprint') => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Lỗi khi lấy fingerprint đã lưu:', error);
    return null;
  }
};

/**
 * So sánh fingerprint hiện tại với fingerprint đã lưu
 * @param {string} currentHash - Hash fingerprint hiện tại
 * @param {string} savedHash - Hash fingerprint đã lưu
 * @returns {boolean} true nếu giống nhau, false nếu khác
 */
export const compareFingerprints = (currentHash, savedHash) => {
  return currentHash === savedHash;
};

