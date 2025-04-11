// подключение express
const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

// объект с кусочками html документа
const objectForCreateDom = {
  htmlHead: `<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Form with Express</title>
    <link href="/css/style.css" type="text/css" rel="stylesheet" />
</head>`,
  bodyDiv: `<body>
    <div>`,
  hForm: `<h3>Заполните данные полей:</h3>
        <form method=GET action="/variants" target="_self" data-form="transition">`,
  divInputLogin: `<div class="fields">
                <p>Введите ваш логин:</p>
                <input class="input" type="text" placeholder="Введите ваш логин" name="login"`,
  successLogin: `<div class="fields">
                <p>Введите ваш логин:</p>
                <input class="input success" type="text" placeholder="Введите ваш логин" name="login"`,
  divInputLoginError: `<div class="fields">
                <p>Введите ваш логин:</p>
                <input class="input errors" type="text" placeholder="Введите ваш логин" name="login"`,
  value: `value="`,
  closeTag: `">`,
  errorLoginOne: `<p class="error_p">В поле логин ничего нет, введине логин</p>`,
  errorLoginTwo: `<p class="error_p">Логин слишком короткий</p>`,
  errorLoginThree: `<p class="error_p">Логин слишком длинный</p>`,
  divClose: `</div>`,
  divInputPassword: `<div class="fields">
                <p>Введите ваш пароль:</p>
                <input class="input" type="text" placeholder="Введите ваш пароль" name="password"`,
  successPassword: `<div class="fields">
                <p>Введите ваш пароль:</p>
                <input class="input success" type="text" placeholder="Введите ваш пароль" name="password"`,
  successSimplyPassword: `<div class="fields">
                <p>Введите ваш пароль:</p>
                <input class="input simply" type="text" placeholder="Введите ваш пароль" name="password"`,
  successMediumPassword: `<div class="fields">
                <p>Введите ваш пароль:</p>
                <input class="input medium" type="text" placeholder="Введите ваш пароль" name="password"`,
  divInputPasswordError: `<div class="fields">
                <p>Введите ваш пароль:</p>
                <input class="input errors" type="text" placeholder="Введите ваш пароль" name="password"`,
  errorPasswordOne: `<p class="error_p">В поле пароль ничего нет, введине пароль</p>`,
  errorPasswordTwo: `<p class="error_p">Пароль слишком короткий</p>`,
  errorPasswordThree: `<p class="error_p">Пароль слишком длинный</p>`,
  simlyPassword: `<p class="simly_p">Пароль простой</p>`,
  mediumPassword: `<p class="medium_p">Пароль средний</p>`,
  hardPassword: `<p class="success_p">Пароль сложный</p>`,
  buttonForm: `<button type="submit">Отправить</button>
        </form>`,
  divHtml: `</div>
</body>
</html>`,
};
// создаем объект приложения
const webserver = express();

// статические данные с JS, CSS, HTML
// webserver.use(express.static(__dirname + "/public"));
webserver.use(express.static(path.join(__dirname, "public")));

webserver.use(express.urlencoded({ extended: false }));
webserver.use(bodyParser.json());

// отдаем html документ
webserver.get("/index.html", function (request, response) {
  response.send(path.join(__dirname, "index.html"));
});

// отправка вариантов ответа для голосования
webserver.get("/variants", function (request, response) {
  try {
    const loginString = JSON.stringify(request.query.login);
    const passwordString = JSON.stringify(request.query.password);
    // проверка для поля логин
    if (loginString.includes("<script>") || loginString.includes("</script>"))
      throw new Error("Нельзя заполнять поле скриптом!");
    if (
      loginString.includes("<") ||
      loginString.includes(">") ||
      loginString.includes("/") ||
      loginString.includes("&")
    )
      throw new Error("Поле логин содержит недопустимые символы");
    // проверка для поля пароль
    if (
      passwordString.includes("<script>") ||
      passwordString.includes("</script>")
    )
      throw new Error("Нельзя заполнять поле скриптом!");
    if (
      passwordString.includes("<") ||
      passwordString.includes(">") ||
      passwordString.includes(" ")
    )
      throw new Error("Поле пароль содержит недопустимые символы");
    // отправляем страницу
    response.status(200).send(`${docHtml(request)}`);
  } catch (error) {
    // отправляем текст ошибки
    response.status(400).send(`${error}`);
  }
});

// начинаем прослушивать подключения на 7681 порту
webserver.listen(7681);

// функция создания html документа
const docHtml = (object) => {
  let anyconst = ``;
  // создаем html документ
  anyconst += objectForCreateDom.htmlHead;
  anyconst += objectForCreateDom.hForm;
  // проверка логина на длину
  if (object.query.login.length !== 0 && object.query.login.length < 4) {
    anyconst += objectForCreateDom.divInputLoginError;
    anyconst += objectForCreateDom.value;
    anyconst += object.query.login;
    anyconst += objectForCreateDom.closeTag;
    anyconst += objectForCreateDom.errorLoginTwo;
  }
  if (object.query.login.length !== 0 && object.query.login.length > 20) {
    anyconst += objectForCreateDom.divInputLoginError;
    anyconst += objectForCreateDom.value;
    anyconst += object.query.login;
    anyconst += objectForCreateDom.closeTag;
    anyconst += objectForCreateDom.errorLoginThree;
  }
  if (
    object.query.login.length !== 0 &&
    object.query.login.length > 4 &&
    object.query.login.length < 20
  ) {
    anyconst += objectForCreateDom.successLogin;
    anyconst += objectForCreateDom.value;
    anyconst += object.query.login;
    anyconst += objectForCreateDom.closeTag;
  }
  if (object.query.login.length === 0) {
    anyconst += objectForCreateDom.divInputLoginError;
    anyconst += objectForCreateDom.value;
    anyconst += object.query.login;
    anyconst += objectForCreateDom.closeTag;
    anyconst += objectForCreateDom.errorLoginOne;
  }
  anyconst += objectForCreateDom.divClose;
  // проверка пароля на длину
  if (object.query.password.length !== 0 && object.query.password.length <= 4) {
    anyconst += objectForCreateDom.divInputPasswordError;
    anyconst += objectForCreateDom.value;
    anyconst += object.query.password;
    anyconst += objectForCreateDom.closeTag;
    anyconst += objectForCreateDom.errorPasswordTwo;
  }
  if (object.query.password.length !== 0 && object.query.password.length > 15) {
    anyconst += objectForCreateDom.divInputPasswordError;
    anyconst += objectForCreateDom.value;
    anyconst += object.query.password;
    anyconst += objectForCreateDom.closeTag;
    anyconst += objectForCreateDom.errorPasswordThree;
  }
  if (
    object.query.password.length !== 0 &&
    object.query.password.length > 4 &&
    object.query.password.length <= 15
  ) {
    if (checkPasswords(object.query.password) === "Простой") {
      anyconst += objectForCreateDom.successSimplyPassword;
      anyconst += objectForCreateDom.value;
      anyconst += object.query.password;
      anyconst += objectForCreateDom.closeTag;
      anyconst += objectForCreateDom.simlyPassword;
    }
    if (checkPasswords(object.query.password) === "Средний") {
      anyconst += objectForCreateDom.successMediumPassword;
      anyconst += objectForCreateDom.value;
      anyconst += object.query.password;
      anyconst += objectForCreateDom.closeTag;
      anyconst += objectForCreateDom.mediumPassword;
    }
    if (checkPasswords(object.query.password) === "Сложный") {
      anyconst += objectForCreateDom.successPassword;
      anyconst += objectForCreateDom.value;
      anyconst += object.query.password;
      anyconst += objectForCreateDom.closeTag;
      anyconst += objectForCreateDom.hardPassword;
    }
  }
  if (object.query.password.length === 0) {
    anyconst += objectForCreateDom.divInputPasswordError;
    anyconst += objectForCreateDom.value;
    anyconst += object.query.password;
    anyconst += objectForCreateDom.closeTag;
    anyconst += objectForCreateDom.errorPasswordOne;
  }
  anyconst += objectForCreateDom.divClose;
  anyconst += objectForCreateDom.buttonForm;
  anyconst += objectForCreateDom.divHtml;
  return anyconst;
};

const checkPasswords = (string) => {
  const s_letters = "qwertyuiopasdfghjklzxcvbnm"; // Буквы в нижнем регистре
  const b_letters = "QWERTYUIOPLKJHGFDSAZXCVBNM"; // Буквы в верхнем регистре
  const digits = "0123456789"; // Цифры
  const specials = "!@#$%^&*()_-+=|/.,:;[]{}"; // Спецсимволы
  let is_s = false; // Есть ли в пароле буквы в нижнем регистре
  let is_b = false; // Есть ли в пароле буквы в верхнем регистре
  let is_d = false; // Есть ли в пароле цифры
  let is_sp = false; // Есть ли в пароле спецсимволы
  for (let i = 0; i < string.length; i++) {
    /* Проверяем каждый символ пароля на принадлежность к тому или иному типу */
    if (!is_s && s_letters.indexOf(string[i]) != -1) is_s = true;
    else if (!is_b && b_letters.indexOf(string[i]) != -1) is_b = true;
    else if (!is_d && digits.indexOf(string[i]) != -1) is_d = true;
    else if (!is_sp && specials.indexOf(string[i]) != -1) is_sp = true;
  }
  let rating = 0;
  let text = "";
  if (is_s) rating++; // Если в пароле есть символы в нижнем регистре, то увеличиваем рейтинг сложности
  if (is_b) rating++; // Если в пароле есть символы в верхнем регистре, то увеличиваем рейтинг сложности
  if (is_d) rating++; // Если в пароле есть цифры, то увеличиваем рейтинг сложности
  if (is_sp) rating++; // Если в пароле есть спецсимволы, то увеличиваем рейтинг сложности
  /* Далее идёт анализ длины пароля и полученного рейтинга, и на основании этого готовится текстовое описание сложности пароля */
  if (string.length < 6 && rating < 3) text = "Простой";
  else if (string.length < 6 && rating >= 3) text = "Средний";
  else if (string.length >= 8 && rating < 3) text = "Средний";
  else if (string.length >= 8 && rating >= 3) text = "Сложный";
  else if (string.length >= 6 && rating == 1) text = "Простой";
  else if (string.length >= 6 && rating > 1 && rating < 4) text = "Средний";
  else if (string.length >= 6 && rating == 4) text = "Сложный";
  return text;
};
