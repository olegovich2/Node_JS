import { postDataForFileField, downloadFileToServer } from "./requests.js";

export const progressBar = document.querySelector(".progress-bar-inner");
export const progressBarContainer = document.querySelector(".progress-bar");
export let connection;
const divGreeting = document.querySelector('[data-div="greeting"]');

export const reconnect = (object, websocketId) => {
  let login = JSON.parse(localStorage.getItem("user")).login;
  if (connection) {
    connection.close(1000, "Предыдущее соединение с сервером закрыто"); // Закрываем предыдущее соединение
  }
  const url = "ws://178.172.195.18:7681";
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
    sendPath(login);
  };
};

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("user")) {
    let login = JSON.parse(localStorage.getItem("user")).login;
    divGreeting.innerHTML = `Добро пожаловать, ${login}`;
    sendPath(login);
  } else {
    redirectToEntry();
  }
});

window.onbeforeunload = function () {
  localStorage.clear();
};

const intervalId = setInterval(() => {
  if (localStorage.getItem("user") === null) {
    redirectToEntry();
    clearInterval(intervalId);
  }
}, 1000);

const redirectToEntry = () => {
  const link = document.createElement("a");
  link.href = "/main/entry";
  link.click();
};

const sendPath = (login) => {
  const object = {};
  object.pathToFile = `upload/${login}/upload.json`;
  postDataForFileField("/openmarker", JSON.stringify(object));
  if (!progressBarContainer.classList.contains("unvisible"))
    progressBarContainer.classList.add("unvisible");
};

export function updateProgressBar(value, when) {
  if (when === "request") progressBar.style.width = `${Number(value) / 2}%`;
  if (when === "write") progressBar.style.width = `${value}%`;
}
