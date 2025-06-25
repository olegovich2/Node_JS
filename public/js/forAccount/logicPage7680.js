import {
  redirectToMain,
  getSurveysAndImages,
  deleteSurveysAndImages,
  downloadFileToServer,
  getOriginImage,
} from "./requests.js";
import {
  redirectToEntry,
  clearResultSurvey,
  createElementsResultSurvey,
  callPrint,
  exportHTML,
  closeAndDownloadOriginImage,
  imageToBlock,
} from "./allFunctionsForWorkAccount.js";
import { elementsForSurveys } from "../constants/allConstants.js";

// хэдер
const headerAccount = document.querySelector("header");
// контейнер осмотра в аккаунте
const survey = document.querySelector(
  elementsForSurveys.surveyFromAccount.elementPath
);
// контейнер основного контента
const mainContent = document.querySelector('[data-main="mainElement"]');

// работа формы загрузки изображений
const formForUpload = document.querySelector(
  '[data-form="formForUploadOnServer"]'
);
const buttonForUpload = document.querySelector('[data-button="buttonUpload"]');
const fileInput = document.querySelector('[data-input="fileChoice"]');
const textareaComment = document.querySelector('[name="textareaComment"]');

// для вебсокета
export const progressBar = document.querySelector(".progress-bar-inner");
export const progressBarContainer = document.querySelector(".progress-bar");
export let connection;

// выход на основную страницу
const exitToMain = (event) => {
  event.preventDefault();
  if (
    event.target.dataset.button === "toMain" ||
    event.target.classList.contains("fa-xmark")
  ) {
    if (localStorage.getItem("user") === null) {
      redirectToEntry();
      localStorage.clear();
    } else {
      mainContent.removeEventListener("click", handleAccountBlocks);
      redirectToMain("/toMain");
      localStorage.removeItem("allSurveys");
      localStorage.removeItem("originImage");
    }
  }
};

// логика работы кнопок в блоке осмотров и изображений
const handleAccountBlocks = (event) => {
  if (event.target.dataset.container === "deleteButton") {
    if (!survey.classList.contains("unvisible")) {
      survey.classList.add("unvisible");
      clearResultSurvey(elementsForSurveys.surveyFromAccount);
    }
    loginForGetSurveys("delete", event.target.dataset.id);
  }
  if (event.target.dataset.container === "deleteButtonImages") {
    loginForGetSurveys("delete", event.target.dataset.id);
  }
  if (event.target.dataset.container === "lookButton") {
    if (survey.classList.contains("unvisible"))
      survey.classList.remove("unvisible");
    clearResultSurvey(elementsForSurveys.surveyFromAccount);
    createElementsResultSurvey(
      JSON.parse(
        JSON.parse(localStorage.getItem("allSurveys"))[event.target.dataset.id]
      ),
      elementsForSurveys.surveyFromAccount
    );
  }
  if (event.target.dataset.container === "lookButtonImages") {
    if (localStorage.getItem("originImage") === null) {
      loginForGetSurveys("origin", event.target.dataset.id);
    } else {
      const object = JSON.parse(localStorage.getItem("originImage"));
      if (event.target.dataset.id === object.id) {
        imageToBlock(object);
      } else {
        localStorage.removeItem("originImage");
        loginForGetSurveys("origin", event.target.dataset.id);
      }
    }
  }
  if (event.target.dataset.account === "print") {
    callPrint("#printFromAccount");
  }
  if (event.target.dataset.account === "closeResultSurvey") {
    if (!survey.classList.contains("unvisible"))
      survey.classList.add("unvisible");
    clearResultSurvey(elementsForSurveys.surveyFromAccount);
  }
  if (event.target.dataset.container === "closeOriginImage") {
    closeAndDownloadOriginImage("close");
  }
  if (event.target.dataset.account === "saveAs") {
    exportHTML("#printFromAccount");
  }
  if (event.target.dataset.container === "downloadButtonImages") {
    closeAndDownloadOriginImage();
  }
};

// получение данных формы изображений
const getDataFromForm = () => {
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
      object.file = arrayBufferToBase64(fileData);
      reconnect(object, id);
      formForUpload.reset();
    };
    reader.readAsArrayBuffer(file);
  } else {
    console.log("no file");
  }
};

// получение логина для работы с таблицей
const loginForGetSurveys = (option, id) => {
  const object = {};
  object.login = JSON.parse(localStorage.getItem("user")).login;
  if (option === "getSurveys") {
    let data = JSON.stringify(object);
    getSurveysAndImages("/getSurveys", data);
  } else if (option === "delete") {
    object.id = id;
    let data = JSON.stringify(object);
    deleteSurveysAndImages("/deleteRow", data);
  } else if (option === "origin") {
    object.id = id;
    let data = JSON.stringify(object);
    getOriginImage("/originImage", data);
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

// работа сокета
export const reconnect = (object, websocketId) => {
  let login = JSON.parse(localStorage.getItem("user")).login;
  if (connection) {
    connection.close(1000, "Предыдущее соединение с сервером закрыто"); // Закрываем предыдущее соединение
  }
  //   const url = "ws://localhost:7680";
  const url = "ws://178.172.195.18:7680";
  connection = new WebSocket(url);
  let string = JSON.stringify(object);
  const objectForMessage = {};
  connection.onopen = (event) => {
    objectForMessage.websocketId = websocketId;
    objectForMessage.message = "Соединение установлено";
    if (progressBarContainer.classList.contains("unvisible"))
      progressBarContainer.classList.remove("unvisible");
    connection.send(JSON.stringify(objectForMessage));
  };

  connection.onmessage = function (event) {
    const objectFromServer = JSON.parse(event.data);
    console.log("Получено сообщение от сервера: " + objectFromServer.message);
    if (
      objectFromServer.message ===
        "Передача и запись данных успешно завершена" ||
      objectFromServer.message ===
        "Передача и запись данных завершилась неудачно"
    ) {
      objectFromServer.message = "CLOSE";
      connection.send(JSON.stringify(objectFromServer));
    } else if (objectFromServer.message.includes("Получено данных: ")) {
      updateProgressBar(
        objectFromServer.message.replace("Получено данных: ", ""),
        "request"
      );
    } else if (objectFromServer.message.includes("Запись завершена на ")) {
      updateProgressBar(
        objectFromServer.message.replace("Запись завершена на ", ""),
        "write"
      );
    } else if (objectFromServer.message === "Соединение установлено") {
      objectFromServer.message = login;
      connection.send(JSON.stringify(objectFromServer));
    } else if (objectFromServer.message === "Получено название директории") {
      downloadFileToServer("/downloadToServer", string);
    }
  };

  connection.onerror = (error) => {
    console.log("Ошибка соединения:", error);
  };

  connection.onclose = (event) => {
    console.log(
      `Соединение закрыто. Код: ${event.code}, причина: ${event.reason}`
    );
    sendPath();
  };
};

const sendPath = () => {
  loginForGetSurveys("getSurveys");
  if (!progressBarContainer.classList.contains("unvisible"))
    progressBarContainer.classList.add("unvisible");
};

export function updateProgressBar(value, when) {
  if (when === "request") progressBar.style.width = `${Number(value) / 2}%`;
  if (when === "write") progressBar.style.width = `${value}%`;
}

headerAccount.addEventListener("click", exitToMain);
mainContent.addEventListener("click", handleAccountBlocks);
buttonForUpload.addEventListener("click", getDataFromForm);

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("user") === null) {
    redirectToEntry();
  } else loginForGetSurveys("getSurveys");
});
