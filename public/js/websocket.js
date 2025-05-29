import { postDataForFileField, downloadFileToServer } from "./requests.js";

export const progressBar = document.querySelector(".progress-bar-inner");
export const progressBarContainer = document.querySelector(".progress-bar");
export let connection;

export const reconnect = (str) => {
  if (connection) {
    connection.close(1000, "Предыдущее соединение с сервером закрыто"); // Закрываем предыдущее соединение
  }
  const url = "ws://178.172.195.18:7681";
  // const url1 = "ws://localhost:7681";
  connection = new WebSocket(url);
  let string = str || "Просто проверка связи";
  connection.onopen = (event) => {
    if (progressBarContainer.classList.contains("unvisible"))
      progressBarContainer.classList.remove("unvisible");
    connection.send("Соединение установлено");
  };

  connection.onmessage = function (event) {
    console.log("Получено сообщение от сервера: " + event.data);
    if (
      event.data === "Передача и запись данных успешно завершена" ||
      event.data === "Передача и запись данных завершилась неудачно"
    ) {
      connection.send("CLOSE");
    } else if (event.data.includes("Получено данных: ")) {
      updateProgressBar(event.data.replace("Получено данных: ", ""), "request");
    } else if (event.data.includes("Запись завершена на ")) {
      updateProgressBar(
        event.data.replace("Запись завершена на ", ""),
        "write"
      );
    } else if (event.data === "Соединение установлено") {
      connection.send(localStorage.getItem("user"));
    } else if (event.data === "Получено название директории") {
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

export function updateProgressBar(value, when) {
  if (when === "request") progressBar.style.width = `${Number(value) / 2}%`;
  if (when === "write") progressBar.style.width = `${value}%`;
}
