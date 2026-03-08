if (!sessionStorage.getItem("reloaded")) {
    sessionStorage.setItem("reloaded", "true");
    location.reload();
}

/* ==========================================================================
   CONFIG & ELEMENT REFERENCES
   ========================================================================== */
const ELEMENTS = {
    video: document.getElementById('video'),
    canvas: document.getElementById('canvas'),
    shutter: document.getElementById('shutter'),
    previewThumb: document.getElementById('preview-thumb'),
    customTextInput: document.getElementById('customText'),

    // Compass Elements
    wheel: document.getElementById("compassWheel"),
    dirLetter: document.getElementById("dirLetter"),
    dirDegree: document.getElementById("dirDegree"),
    enableBtn: document.getElementById("enableCompassBtn"),
    needle: document.getElementById("compassNeedle"),

    // UI Panels
    startup: document.getElementById("startupScreen"),
    warning: document.getElementById("rotateWarning"),
    galleryModal: document.getElementById("galleryModal"),
    galleryGrid: document.getElementById("gallery")


};

/* ==========================================================================
   GLOBAL STATE
   ========================================================================== */
let state = {
    videoTrack: null,
    currentFacing: "environment",
    currentZoom: 1,
    initialDistance: null,
    cameraGranted: false,
    compassGranted: false,
    capturedImages: [],
    isInGallery: false
};

/* ==========================================================================
   CORE SYSTEM: CAMERA LOGIC
   ========================================================================== */

/**
 * เริ่มต้นการใช้งานกล้อง
 */
async function initCamera() {
    if (state.videoTrack) state.videoTrack.stop();

    try {
        const constraints = {
            video: {
                facingMode: { ideal: state.currentFacing },
                zoom: 0.5,
                width: { ideal: 3840 },
                height: { ideal: 2160 }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        ELEMENTS.video.srcObject = stream;
        state.videoTrack = stream.getVideoTracks()[0];
        state.cameraGranted = true;

        // ซ่อนปุ่มขอสิทธิ์ถ้าใช้งานได้แล้ว
        const camBtn = document.getElementById("cameraBtn");
        if (camBtn) camBtn.style.display = "none";

        refreshSystemState();
    } catch (e) {
        console.error("Camera Init Error:", e);
        state.cameraGranted = false;
    }
}



/**
 * สลับกล้องหน้า-หลัง
 */
function switchFacing() {
    state.currentFacing = (state.currentFacing === "environment") ? "user" : "environment";
    initCamera();
}

/* ==========================================================================
   SENSORS: COMPASS & GEOLOCATION
   ========================================================================== */

/**
 * จัดการสิทธิ์และการเข้าถึงเข็มทิศ
 */
ELEMENTS.enableBtn.addEventListener("click", async () => {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === "granted") setupCompass();
    } else {
        setupCompass();
    }
});

function setupCompass() {
    state.compassGranted = true;
    ELEMENTS.enableBtn.style.display = "none";
    window.addEventListener("deviceorientation", handleOrientation, true);
    refreshSystemState();
}



function handleOrientation(e) {

    let heading = null;

    // iOS
    if (typeof e.webkitCompassHeading !== "undefined") {
        heading = e.webkitCompassHeading;
    }
    // Android
    else if (e.alpha !== null) {
        heading = 360 - e.alpha;
    }

    if (heading === null) return;

    // 🔥 ปรับตาม screen orientation จริง
    const orientation = screen.orientation?.angle || window.orientation || 0;
    heading = (heading + orientation) % 360;

    const finalDeg = Math.round(heading);

    // ===== Update Compass Wheel =====
    if (ELEMENTS.wheel)
        ELEMENTS.wheel.style.transform = `rotate(${-finalDeg}deg)`;

    if (ELEMENTS.dirLetter)
        ELEMENTS.dirLetter.innerText = getCardinalDirection(finalDeg);

    if (ELEMENTS.dirDegree)
        ELEMENTS.dirDegree.innerText = `${finalDeg}°`;

    // ===== Update Bottom HUD Text =====
    const degText = document.getElementById("degreeText");
    const dirText = document.getElementById("directionText");

    if (degText) degText.textContent = `(${finalDeg}°)`;
    if (dirText) dirText.textContent = getThaiDirection(finalDeg);

    if (ELEMENTS.needle)
        ELEMENTS.needle.style.transform =
            `translateX(-50%) rotate(${finalDeg}deg)`;
}


/* ==========================================================================
   ZOOM & INTERACTION
   ========================================================================== */

/**
 * ปรับระยะซูม
 */
async function setZoom(value, btnElement) {
    if (!state.videoTrack) return;

    document.querySelectorAll('.zoom-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    const cap = state.videoTrack.getCapabilities();
    if (cap.zoom) {
        const realZoom = Math.min(cap.zoom.max, Math.max(cap.zoom.min, value));
        await state.videoTrack.applyConstraints({ advanced: [{ zoom: realZoom }] });
        state.currentZoom = realZoom;
    } else {
        ELEMENTS.video.style.transform = `scale(${value})`;
    }
}

/**
 * Pinch to Zoom Logic
 */
ELEMENTS.video.addEventListener("touchstart", e => {
    if (e.touches.length === 2) state.initialDistance = getTouchDist(e.touches);
}, { passive: true });

ELEMENTS.video.addEventListener("touchmove", async e => {
    if (e.touches.length === 2 && state.initialDistance && state.videoTrack) {
        const newDist = getTouchDist(e.touches);
        const cap = state.videoTrack.getCapabilities();
        if (cap.zoom) {
            let newZoom = state.currentZoom * (newDist / state.initialDistance);
            newZoom = Math.min(cap.zoom.max, Math.max(cap.zoom.min, newZoom));
            await state.videoTrack.applyConstraints({ advanced: [{ zoom: newZoom }] });
            state.currentZoom = newZoom;
            state.initialDistance = newDist;
        }
    }
}, { passive: true });

function getTouchDist(t) {
    return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
}

/* ==========================================================================
   UI UTILITIES: ORIENTATION & TIME
   ========================================================================== */

/**
 * ตรวจสอบความพร้อมของระบบและการหมุนจอ
 */
function refreshSystemState() {

    const angle = getScreenAngle();
    const isCorrectOrientation = (angle === 90);

    // 🔥 ถ้าอยู่หน้า Gallery → ไม่บังคับแนว
    if (state.isInGallery) {
        ELEMENTS.startup.style.display = "none";
        ELEMENTS.warning.style.display = "none";
        return;
    }

    // อัปเดตไฟสถานะ
    updateDotStatus("camDot", "camText", state.cameraGranted, "ใช้งานได้");
    updateDotStatus("compassDot", "compassText", state.compassGranted, "ใช้งานได้");
    updateDotStatus(
        "rotateDot",
        "rotateText",
        isCorrectOrientation,
        "อยู่แนวนอนหมุนซ้ายแล้ว",
        "ยังไม่ได้อยู่แนวนอนหมุนซ้าย"
    );

    // แสดง/ซ่อน Startup
    ELEMENTS.startup.style.display =
        (state.cameraGranted && state.compassGranted && isCorrectOrientation)
            ? "none"
            : "flex";

    // แสดง/ซ่อน Warning
    if (state.cameraGranted && state.compassGranted) {
        ELEMENTS.warning.style.display =
            isCorrectOrientation ? "none" : "flex";
    }
}


function getScreenAngle() {
    return (screen.orientation && screen.orientation.angle !== null) ? screen.orientation.angle : window.orientation;
}

function updateDotStatus(dotId, textId, condition, okMsg, errMsg = "") {
    const dot = document.getElementById(dotId);
    const txt = document.getElementById(textId);
    if (!dot || !txt) return;

    if (condition) {
        dot.classList.add("ready");
        txt.textContent = okMsg;
    } else {
        dot.classList.remove("ready");
        if (errMsg) txt.textContent = errMsg;
    }
}

/**
 * นาฬิกาแบบ Real-time
 */
function updateClock() {
    const now = new Date();

    const dateStr = now.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const timeStr = now.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    const dEl = document.getElementById("dateText");
    const tEl = document.getElementById("timeText");

    if (dEl) dEl.textContent = dateStr;
    if (tEl) tEl.textContent = timeStr;
}
setInterval(updateClock, 1000);

/* ==========================================================================
   PHOTO CAPTURE & GALLERY
   ========================================================================== */

ELEMENTS.shutter.onclick = async () => {
    if (getScreenAngle() !== 90) {
        alert("กรุณาถือเครื่องแนวนอนหมุนซ้ายเท่านั้น");
        return;
    }

    const ctx = ELEMENTS.canvas.getContext('2d');
    ELEMENTS.canvas.width = ELEMENTS.video.videoWidth;
    ELEMENTS.canvas.height = ELEMENTS.video.videoHeight;

    // 1️⃣ วาดภาพจากกล้อง
    ctx.drawImage(ELEMENTS.video, 0, 0);

    // 2️⃣ ใส่โลโก้
    const logo = new Image();
    logo.src = "icon-img.png";

    await new Promise(resolve => {
        logo.onload = resolve;
    });

    const logoWidth = ELEMENTS.canvas.width * 0.06;
    const logoHeight = logo.height * (logoWidth / logo.width);
    const padding = ELEMENTS.canvas.width * 0.02;

    // ⭐ ตั้งค่าความโปร่งใส
    ctx.globalAlpha = 0.7;

    ctx.drawImage(
        logo,
        padding,
        padding,
        logoWidth,
        logoHeight
    );

    // ⭐ คืนค่า opacity กลับปกติ (สำคัญมาก!)
    ctx.globalAlpha = 1.0;

    // 3️⃣ Render Overlay (HUD)
    const overlay = document.querySelector(".radar-overlay");
    const overlayCanvas = await html2canvas(overlay, {
        backgroundColor: null,
        scale: window.devicePixelRatio * 2
    });

    const oWidth = ELEMENTS.canvas.width * 0.7;
    const oHeight = overlayCanvas.height * (oWidth / overlayCanvas.width);
    const posX = (ELEMENTS.canvas.width - oWidth) / 2;
    const posY = ELEMENTS.canvas.height - oHeight - (ELEMENTS.canvas.height * 0.04);

    ctx.drawImage(overlayCanvas, posX, posY, oWidth, oHeight);

    // 4️⃣ บันทึก
    ELEMENTS.canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        state.capturedImages.push({ blob, url, selected: false });

        ELEMENTS.previewThumb.style.backgroundImage = `url(${url})`;
        renderGallery();
    }, "image/jpeg", 1.0);
};




/**
 * เอฟเฟกต์แฟลชหน้าจอ
 */
const flash = document.getElementById("flashEffect");

function triggerFlash() {
    flash.style.opacity = "0.5";
    setTimeout(() => {
        flash.style.opacity = "0";
    }, 40);
}

const shutterSound = new Audio("shutter.mp3");

function playShutterSound() {
    shutterSound.currentTime = 0;
    shutterSound.play();
}
shutter.addEventListener("click", () => {

    shutter.style.transform = "scale(0.9)";
    setTimeout(() => shutter.style.transform = "scale(1)", 100);

    triggerFlash();
    playShutterSound();

    takePhoto();
});

document.addEventListener("DOMContentLoaded", () => {

    state.isInGallery = false;   // 🔥 บังคับเริ่มต้น
    ELEMENTS.galleryModal.style.display = "none";

    refreshSystemState();
});


/**
 * จัดการ Gallery
 */
function renderGallery() {
    ELEMENTS.galleryGrid.innerHTML = "";

    state.capturedImages.forEach((img, i) => {

        const wrapper = document.createElement("div");
        wrapper.className = "item";

        const elImg = document.createElement("img");
        elImg.src = img.url;

        const downloadBtn = document.createElement("button");
        downloadBtn.className = "download-btn";
        downloadBtn.innerHTML = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 3v12"></path>
  <path d="M7 10l5 5 5-5"></path>
  <path d="M5 21h14"></path>
</svg>
`;

        downloadBtn.onclick = () => {
            const a = document.createElement("a");
            a.href = img.url;
            a.download = `PRO_MAX_${Date.now()}.jpg`;
            a.click();
        };

        wrapper.appendChild(elImg);
        wrapper.appendChild(downloadBtn);
        ELEMENTS.galleryGrid.appendChild(wrapper);
    });
}



/**
 * คัดลอกข้อความ
 */

function radarCopyCode() {

    const dateText = document.getElementById("dateText").textContent;

    const text =
        `ภาพท้องฟ้า 4 ทิศ สรก.
ขณะปล่อยบอลลูนตรวจสภาพอากาศ
วันที่ ${dateText}`;

    navigator.clipboard.writeText(text);

    const btn = document.getElementById("radarCopyBtn");
    const icon = document.getElementById("radarCopyIcon");
    const check = document.getElementById("radarCheckIcon");

    btn.classList.add("copied");

    icon.style.display = "none";
    check.style.display = "inline";

    setTimeout(() => {
        btn.classList.remove("copied");
        icon.style.display = "inline";
        check.style.display = "none";
    }, 2000);

}



/**
 * โหลดทีละรูปแบบเสถียร (iPhone Safe)
 */
document.getElementById("downloadSelected").onclick = async () => {

    const selected =
        state.capturedImages.filter(i => i.selected);

    if (!selected.length)
        return alert("ยังไม่ได้เลือกรูป");

    for (let i = 0; i < selected.length; i++) {

        await downloadOne(selected[i].url, i);

    }
};

function downloadImage(url, index) {

    const a = document.createElement("a");
    a.href = url;
    a.download = `PRO_MAX_${Date.now()}_${index}.jpg`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


/**
 * Gallery Modal Controls
 */
ELEMENTS.previewThumb.onclick = () => {
    ELEMENTS.galleryModal.style.display = "flex";
    state.isInGallery = true;
    renderGallery();
};

document.getElementById("closeGallery").onclick = () => {
    ELEMENTS.galleryModal.style.display = "none";
    state.isInGallery = false;
    refreshSystemState();
};


/* ==========================================================================
   HELPER FUNCTIONS
   ========================================================================== */

function getCardinalDirection(d) {
    const sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return sectors[Math.round(d / 45) % 8];
}

function getThaiDirection(deg) {
    const directions = ["ทิศเหนือ", "ทิศตะวันออกเฉียงเหนือ", "ทิศตะวันออก", "ทิศตะวันออกเฉียงใต้", "ทิศใต้", "ทิศตะวันตกเฉียงใต้", "ทิศตะวันตก", "ทิศตะวันตกเฉียงเหนือ"];
    return directions[Math.round(deg / 45) % 8];
}



/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

window.addEventListener("orientationchange", refreshSystemState);
window.addEventListener("resize", refreshSystemState);
window.addEventListener("load", () => {
    updateClock();
    refreshSystemState();
    initCamera();
});




