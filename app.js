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
  if (!request.body) return response.sendStatus(400);
  let key = request.body.colour;
  const object = JSON.parse(fs.readFileSync("answer.json", "utf8"));
  object[key] = object[key] + 1;
  fs.writeFileSync("answer.json", JSON.stringify(object));
  response.sendStatus(200);
});

// получаем статистику ответов
webserver.post("/stat", function (request, response) {
  if (!request.body) return response.sendStatus(400);
  response.status(200).send(fs.readFileSync("answer.json", "utf8"));
});

// начинаем прослушивать подключения на 7622 порту
webserver.listen(7681);
