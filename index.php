<!DOCTYPE html>
<html lang="th">

<head>
    <meta charset="UTF-8">
    <meta name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">

    <title>Camera Pro Max - Radar Station</title>

    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#000000">
    <link rel="apple-touch-icon" href="icons/icon-192.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">

    <link rel="stylesheet" href="camera-pro-max.css">
    <link rel="apple-touch-icon" sizes="180x180" href="icons/icon-192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="icons/icon-192.png">
    <link rel="icon" type="image/png" sizes="16x16" href="icons/icon-192.png">
    <link rel="icon" href="favicon.ico">



</head>

<body>

    <div class="startup-screen" id="startupScreen">
        <div class="permission-wrapper">
            <h1>ตั้งค่าระบบ<br>Camera Pro</h1>

            <div class="permission-grid">
                <div class="permission-item">
                    <img src="camera.png" class="perm-icon">
                    <div class="status">
                        <span class="dot" id="camDot"></span>
                        <span id="camText">รอกล้อง</span>
                    </div>
                    <button id="cameraBtn" onclick="initCamera()">เปิดกล้อง</button>
                </div>

                <div class="permission-item">
                    <img src="compassi.png" class="perm-icon">
                    <div class="status">
                        <span class="dot" id="compassDot"></span>
                        <span id="compassText">รอเข็มทิศ</span>
                    </div>
                    <button id="enableCompassBtn">เปิดเข็มทิศ</button>
                </div>

            </div>
        </div>
    </div>

    <div class="rotate-warning" id="rotateWarning">
        <div>
            <img src="rotate.png" class="perm-icon">
            <p>กรุณาหมุนโทรศัพท์แนวนอน (หมุนซ้าย)<br>เพื่อเริ่มการใช้งาน</p>
        </div>
    </div>
    <div id="flashEffect"></div>


    <div id="camera-view">
        <video id="video" autoplay playsinline></video>

        <div class="grid">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>



        <div class="radar-overlay">
            <div class="overlay-title">
                สถานีเรดาร์ฝนหลวงร้องกวาง ต.ทุ่งศรี อ.ร้องกวาง จ.แพร่
            </div>

            <div class="overlay-content">
                <div class="col">
                    <div class="compass-container">
                        <img src="compass.png" id="compassWheel" alt="Compass">
                        <div class="compass-center">
                            <div id="dirLetter">--</div>
                        </div>
                        <div class="compass-pointer"></div>
                    </div>
                </div>

                <div class="col">
                    <div class="direction-main" id="directionText">ทิศทาง</div>
                    <div class="direction-main1" id="degreeText">(--°)</div>
                </div>

                <div class="divider"></div>

                <div class="col center">
                    <div class="label">ความสูงจากระดับน้ำทะเล</div>
                    <div class="altitude" id="altitudeValue">--</div>
                </div>

                <div class="divider"></div>

                <div class="col right">
                    <div class="date" id="dateText">-- --- ----</div>
                    <div class="time">
                        <span id="timeText">--:--</span>
                        <span class="minute"> น.</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="bottom-bar">
        <div class="shutter-row">
            <div id="preview-thumb"></div>

            <button id="shutter" aria-label="Take Photo"></button>

            <button class="btn btn-icon" onclick="switchFacing()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15">
                    </path>
                </svg>
            </button>
        </div>
    </div>

    <div id="galleryModal" class="gallery-modal">

        <div class="gallery-header">
            <button id="closeGallery" class="btn-primary">ปิด</button>

            <div class="gallery-title">
                คลังภาพสำรวจ

            </div>

            <button id="downloadSelected" class="btn-primary " disabled>
                V.1.0.0
            </button>
        </div>

        <div id="gallery" class="gallery-grid"></div>

    </div>

    <canvas id="canvas"></canvas>

    <script src="camera-pro-max.js"></script>

</body>

</html>