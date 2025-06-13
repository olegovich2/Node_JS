import { reconnect } from "./websocket.js";
import { deleteFile, downloadFile } from "./requests.js";

const buttonForUpload = document.querySelector('[data-button="buttonUpload"]');
const fileInput = document.querySelector('[data-input="fileChoice"]');
const textareaComment = document.querySelector('[name="textareaComment"]');
const formForUpload = document.querySelector(
  '[data-form="formForUploadOnServer"]'
);
export const divFieldMarker = document.querySelector('[data-div="result"]');

const getDataFromForm = (event) => {
  const object = {};
  const file = fileInput.files[0];
  const id = Date.now().toString();
  if (file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = e.target.result;
      object.websocketid = id;
      object.filename = file.name;
      object.comment = textareaComment.value;
      object.id = id;
      object.file = arrayBufferToBase64(fileData);
      reconnect(object, id);
      formForUpload.reset();
    };
    reader.readAsArrayBuffer(file);
  } else {
    console.log("no file");
  }
};

export const generateMarkerInField = (object, filename) => {
  const moduleTemplate = document.querySelector(
    '[data-template="template_marker"]'
  )?.content;
  const clone = moduleTemplate.childNodes[1].cloneNode(true);
  clone.dataset.id = object.id;
  clone.querySelector('[data-p="filename"]').textContent = filename;
  clone.querySelector('[data-p="comment"]').textContent = object.comment;
  clone.querySelector('[data-button="download_file"]').dataset.id = object.id;
  clone.querySelector('[data-button="delete_file"]').dataset.id = object.id;
  divFieldMarker.appendChild(clone);
};

export const clearAndGenerateMarkers = (object) => {
  divFieldMarker.innerHTML = "";
  if (object.text) divFieldMarker.innerHTML = object.text;
  else
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        generateMarkerInField(object[key], key);
      }
    }
};

export const manualControlFieldMarker = (event) => {
  event.preventDefault();
  if (event.target.dataset.button === "download_file") {
    downloadFile(
      "/download",
      JSON.stringify(objectForRequests(event.target.dataset.id))
    );
  }
  if (event.target.dataset.button === "delete_file") {
    deleteFile(
      "/delete",
      JSON.stringify(objectForRequests(event.target.dataset.id))
    );
  }
};

const objectForRequests = (id) => {
  let login = JSON.parse(localStorage.getItem("user")).login;
  const object = {};
  object.id = id;
  object.pathToFile = `upload/${login}/upload.json`;
  return object;
};

export const download = (filename, file) => {
  if (
    filename.includes(".jpg") ||
    filename.includes(".jpeg") ||
    filename.includes(".png") ||
    filename.includes(".gif")
  ) {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${file}`;
    link.download = `${filename}`;
    link.click();
  } else if (
    filename.includes(".txt") ||
    filename.includes(".doc") ||
    filename.includes(".docx") ||
    filename.includes(".css") ||
    filename.includes(".js") ||
    filename.includes(".ts")
  ) {
    const link = document.createElement("a");
    link.href =
      "data:text/plain;charset=utf-8," + encodeURIComponent(atob(file));
    link.download = `${filename}`;
    link.click();
  } else if (filename.includes(".pdf")) {
    const link = document.createElement("a");
    const arrayBuf = b64ToBuffer(file);
    const uint8Array = new Uint8Array(arrayBuf);
    const blob = new Blob([uint8Array], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${filename}`;
    link.click();
  } else if (filename.includes(".mp3")) {
    const link = document.createElement("a");
    const arrayBuf = b64ToBuffer(file);
    const uint8Array = new Uint8Array(arrayBuf);
    const mp3Blob = new Blob([uint8Array], { type: "audio/mp3" });
    const url = URL.createObjectURL(mp3Blob);
    link.href = url;
    link.download = `${filename}`;
    link.click();
  }
};

function arrayBufferToBase64(buffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

const b64ToBuffer = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;

buttonForUpload.addEventListener("click", getDataFromForm);
divFieldMarker.addEventListener("click", manualControlFieldMarker);
