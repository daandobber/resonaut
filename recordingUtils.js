import { appMenuRecordBtn } from "./utils/domElements.js";

let mediaRecorder;
let recordedChunks = [];
let mediaStreamDestinationNodeForRecording = null;

export function startRecording() {
  const audioContext = window.audioContext;
  const masterGain = window.masterGain;
  if (!audioContext || audioContext.state !== "running" || !masterGain) {
    alert(
      "Audio context is niet actief. Start of hervat audio via de Play knop.",
    );
    return;
  }

  mediaStreamDestinationNodeForRecording =
    audioContext.createMediaStreamDestination();

  try {
    masterGain.connect(mediaStreamDestinationNodeForRecording);
  } catch (e) {
    console.error(
      "FATALE FOUT: Kon masterGain niet verbinden met mediaStreamDestinationNodeForRecording (voor aftappen):",
      e,
    );
    alert("Opnamefout: Kon audio-aftap niet instellen.");
    mediaStreamDestinationNodeForRecording = null;
    return;
  }

  let streamToRecord;
  try {
    streamToRecord = mediaStreamDestinationNodeForRecording.stream;
  } catch (e) {
    console.error(
      "FATALE FOUT: Kon .stream eigenschap niet benaderen van mediaStreamDestinationNodeForRecording:",
      e,
    );
    alert("Opnamefout: Kon audio stream niet verkrijgen na aftappen.");
    try {
      masterGain.disconnect(mediaStreamDestinationNodeForRecording);
    } catch (e2) {}
    mediaStreamDestinationNodeForRecording = null;
    return;
  }

  recordedChunks = [];
  const possibleTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/wav",
  ];
  let selectedType = "";
  for (const type of possibleTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      selectedType = type;
      break;
    }
  }

  const options = selectedType ? { mimeType: selectedType } : undefined;

  try {
    mediaRecorder = new MediaRecorder(streamToRecord, options);
  } catch (e) {
    console.warn(
      "Kon MediaRecorder niet initialiseren met opgegeven opties. Probeert standaard.",
      e,
    );
    try {
      mediaRecorder = new MediaRecorder(streamToRecord);
    } catch (e2) {
      alert(
        "MediaRecorder API wordt niet ondersteund of kon niet initialiseren: " +
          e2.message,
      );
      console.error("MediaRecorder initialisatie mislukt:", e2);
      try {
        masterGain.disconnect(mediaStreamDestinationNodeForRecording);
      } catch (e3) {}
      mediaStreamDestinationNodeForRecording = null;
      return;
    }
  }

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, {
      type: mediaRecorder.mimeType,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    const timestamp = new Date()
      .toISOString()
      .slice(0, 16)
      .replace("T", "_")
      .replace(":", "-");
    let fileExtension = ".wav";
    if (mediaRecorder.mimeType.includes("webm")) {
      fileExtension = ".webm";
    } else if (mediaRecorder.mimeType.includes("ogg")) {
      fileExtension = ".ogg";
    }
    a.download = `Resonaut_Sessie_${timestamp}${fileExtension}`;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    recordedChunks = [];

    if (masterGain && mediaStreamDestinationNodeForRecording) {
      try {
        masterGain.disconnect(mediaStreamDestinationNodeForRecording);
      } catch (e) {
        console.warn(
          "Fout bij loskoppelen van masterGain van opname-node na stop:",
          e,
        );
      }
    }
    if (mediaStreamDestinationNodeForRecording) {
      try {
        mediaStreamDestinationNodeForRecording.disconnect();
      } catch (e) {}
    }
    mediaStreamDestinationNodeForRecording = null;
  };

  mediaRecorder.start();
  window.isRecording = true;
  if (appMenuRecordBtn) {
    appMenuRecordBtn.textContent = "◼ Stop";
    appMenuRecordBtn.classList.add("active");
  }
}

export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  window.isRecording = false;
  if (appMenuRecordBtn) {
    appMenuRecordBtn.textContent = "🔴 Record";
    appMenuRecordBtn.classList.remove("active");
  }
}

