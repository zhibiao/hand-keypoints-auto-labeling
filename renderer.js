import {
  FilesetResolver,
  HandLandmarker,
} from "./@mediapipe/tasks-vision/vision_bundle.js";

const { writeFileSync, mkdirSync } = electronAPI;

const videoWidth = 640,
  videoHeight = 480,
  frameRate = 30;

const localVideo = document.createElement("video"),
  localCanvas = document.querySelector("#localCanvas"),
  gestureCategory = document.querySelector("#gestureCategory"),
  btnSave = document.querySelector("#btnSave");

let isReady = false;
btnSave.addEventListener("click", () => {
  isReady = true;
});

const DATASET_DIR = `datasets/${new Date().valueOf()}`;
mkdirSync(DATASET_DIR);

try {
  const mediaConstraints = {
    audio: false,
    video: {
      width: videoWidth,
      height: videoHeight,
      frameRate: frameRate,
    },
  };

  const mediaStream = await navigator.mediaDevices.getUserMedia(
    mediaConstraints
  );

  localVideo.srcObject = mediaStream;
  localVideo.onloadedmetadata = () => {
    localCanvas.width = localVideo.videoWidth;
    localCanvas.height = localVideo.videoHeight;
    localVideo.play();
  }
} catch (error) {
  console.error(error);
}

const vision = await FilesetResolver.forVisionTasks(
  "@mediapipe/tasks-vision/wasm"
);

const handLandmarker = await HandLandmarker.createFromOptions(
  vision,
  {
    baseOptions: {
      modelAssetPath: "./@mediapipe/tasks-vision/hand_landmarker.task",
      delegate: "GPU",
    },
    numHands: 1,
  });

handLandmarker.setOptions({ runningMode: "video" });

let lastVideoTime = -1;

async function renderLoop() {
  if (localVideo.currentTime !== lastVideoTime) {
    const timestamp = Date.now();
    const detections = handLandmarker.detectForVideo(localVideo, timestamp);
    handleResult(detections);
    lastVideoTime = localVideo.currentTime;
  }

  requestAnimationFrame(() => {
    renderLoop();
  });
}

async function handleResult(detections) {
  const { landmarks: handLandmarks } = detections;

  const ctx = localCanvas.getContext('2d');

  ctx.clearRect(0, 0, localCanvas.width, localCanvas.height);
  ctx.drawImage(localVideo, 0, 0, localCanvas.width, localCanvas.height);

  if (handLandmarks.length > 0) {
    const boundingRect = getBoundingRectangle(handLandmarks[0]);

    if (isReady) {
      isReady = false;
      const baseName = `${new Date().valueOf()}`
      const jsonData = JSON.stringify({
        "imageWidth": localCanvas.width,
        "imageHeight": localCanvas.height,
        "gestureCategory": gestureCategory.value,
        "boundingRect": boundingRect,
        "handLandmarks": handLandmarks,
      });

      localCanvas.toBlob(async (blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        writeFileSync(`${DATASET_DIR}/${baseName}.jpg`, new Uint8Array(arrayBuffer));
      }, "image/jpeg", 1.0);

      writeFileSync(`${DATASET_DIR}/${baseName}.json`, jsonData);
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'red';

    ctx.strokeRect(
      boundingRect[0] * localCanvas.width,
      boundingRect[1] * localCanvas.height,
      boundingRect[2] * localCanvas.width,
      boundingRect[3] * localCanvas.height
    );

    for (const landmarks of handLandmarks) {
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color: "#05DEFF",
        lineWidth: 2
      });

      drawLandmarks(ctx, landmarks, { color: "#007BD4", lineWidth: 2 });
    }

  }

}

function getBoundingRectangle(landmarks) {
  let minX = landmarks[0].x;
  let minY = landmarks[0].y;
  let maxX = landmarks[0].x;
  let maxY = landmarks[0].y;

  for (let i = 1; i < landmarks.length; i++) {
    if (landmarks[i].x < minX) {
      minX = landmarks[i].x;
    }

    if (landmarks[i].y < minY) {
      minY = landmarks[i].y;
    }

    if (landmarks[i].x > maxX) {
      maxX = landmarks[i].x;
    }

    if (landmarks[i].y > maxY) {
      maxY = landmarks[i].y;
    }
  }

  return [minX, minY, maxX - minX, maxY - minY];
}

renderLoop();