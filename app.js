// подключение express
const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

// создаем объект приложения
const webserver = express();

// статические данные с JS, CSS, HTML
webserver.use(express.static(__dirname + "/public"));
webserver.use(express.urlencoded({ extended: false }));
webserver.use(bodyParser.json());

// отдаем html документ
webserver.get("/index.html", function (request, response) {
  response.send(path.join(__dirname, "index.html"));
});

// отправка вариантов ответа для голосования
webserver.get("/variants", function (request, response) {
  response
    .status(200)
    .send(JSON.parse(fs.readFileSync("question.json", "utf8")));
});

// получаем результат голосования
webserver.post("/vote", function (request, response) {
  try {
    if (!request.body) throw new Error("Получение данных завершилось неудачей");
    let key = escapeHTML(request.body.colour);
    const object = JSON.parse(fs.readFileSync("answer.json", "utf8"));
    if (!object.hasOwnProperty(key)) throw new Error("Неверные данные");
    object[key] = object[key] + 1;
    fs.writeFileSync("answer.json", JSON.stringify(object));
    response.sendStatus(200);
  } catch (error) {
    response.status(400).send(`${error}`);
  }
});

// получаем статистику ответов
webserver.post("/stat", function (request, response) {
  try {
    if (!request.body) throw new Error("Получение данных завершилось неудачей");
    response.status(200).send(fs.readFileSync("answer.json", "utf8"));
  } catch (error) {
    response.status(400).send(`${error}`);
  }
});

// начинаем прослушивать подключения на 7681 порту
webserver.listen(7680);

// функция санации ключа объекта
const escapeHTML = (text) => {
  if (!text) return text;
  text = text
    .toString()
    .split("&")
    .join("&amp;")
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;")
    .split('"')
    .join("&quot;")
    .split("'")
    .join("&#039;");
  return text;
};
