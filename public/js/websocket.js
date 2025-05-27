import { postDataForFileField } from "./requests.js";

export let connection;
export const reconnect = (str) => {
  if (connection) {
    connection.close(1000, "Предыдущее соединение с сервером закрыто"); // Закрываем предыдущее соединение
  }
  const url = "ws://178.172.195.18:7680";
  connection = new WebSocket(url); // это сокет-соединение с сервером
  let string = str || "Просто проверка связи";
  connection.onopen = (event) => {
    connection.send("Соединение установлено"); // можно послать строку, Blob или ArrayBuffer
    connection.send(localStorage.getItem("user"));
    connection.send(string);
    connection.send("CLOSE");
  };

  connection.onmessage = function (event) {
    console.log("Получено сообщение от сервера: " + event.data);
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
};
