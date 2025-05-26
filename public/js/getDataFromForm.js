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
  if (file) {
    if (
      file.name.includes(".jpg") ||
      file.name.includes(".jpeg") ||
      file.name.includes(".png") ||
      file.name.includes(".gif")
    ) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target.result;
        object.filename = file.name;
        object.comment = textareaComment.value;
        object.id = Date.now().toString();
        object.file = bufferToBase64(fileData);
        reconnect(JSON.stringify(object));
        formForUpload.reset();
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target.result;
        object.filename = file.name;
        object.comment = textareaComment.value;
        object.id = Date.now().toString();
        object.file = btoa(new TextDecoder().decode(fileData));
        reconnect(JSON.stringify(object));
        formForUpload.reset();
      };
      reader.readAsArrayBuffer(file);
    }
  } else {
    console.log("no file");
  }
};

function bufferToBase64(buf) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
}

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
  const object = {};
  object.id = id;
  object.pathToFile = `upload/${localStorage.getItem("user")}/upload.json`;
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
  } else {
    const link = document.createElement("a");
    link.href =
      "data:text/plain;charset=utf-8," + encodeURIComponent(atob(file));
    link.download = `${filename}`;
    link.click();
  }
};

buttonForUpload.addEventListener("click", getDataFromForm);
divFieldMarker.addEventListener("click", manualControlFieldMarker);
