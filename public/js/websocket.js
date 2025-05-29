import { postDataForFileField } from "./requests.js";

export const progressBar = document.querySelector(".progress-bar-inner");
export const progressBarContainer = document.querySelector(".progress-bar");
export let connection;
export const reconnect = (str) => {
  if (connection) {
    connection.close(1000, "Предыдущее соединение с сервером закрыто"); // Закрываем предыдущее соединение
  }
  // const url = "ws://178.172.195.18:7680";
  const url1 = "ws://localhost:7682";
  connection = new WebSocket(url1); // это сокет-соединение с сервером
  let string = str || "Просто проверка связи";
  connection.onopen = (event) => {
    if (progressBarContainer.classList.contains("unvisible"))
      progressBarContainer.classList.remove("unvisible");
    connection.send("Соединение установлено"); // можно послать строку, Blob или ArrayBuffer
    connection.send(localStorage.getItem("user"));
    connection.send(string);
  };

  connection.onmessage = function (event) {
    console.log("Получено сообщение от сервера: " + event.data);
    if (
      event.data === "Передача и запись данных успешно завершена" ||
      event.data === "Передача и запись данных завершилась неудачно"
    ) {
      connection.send("CLOSE");
    } else if (event.data.includes("%")) {
      updateProgressBar(event.data.replace("Запись завершена на ", ""));
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

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("user")) {
    alert(`Добро пожаловать, ${localStorage.getItem("user")}`);
    sendPath();
  } else {
    let nameUser = prompt("Как Вас зовут?");
    localStorage.setItem("user", nameUser);
    alert(`Добро пожаловать, ${nameUser}`);
    sendPath();
  }
});

const sendPath = () => {
  const object = {};
  object.pathToFile = `upload/${localStorage.getItem("user")}/upload.json`;
  postDataForFileField("/openmarker", JSON.stringify(object));
  if (!progressBarContainer.classList.contains("unvisible"))
    progressBarContainer.classList.add("unvisible");
};

export function updateProgressBar(value) {
  progressBar.style.width = value;
}
