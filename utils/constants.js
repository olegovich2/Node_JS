// объект с кусочками html
const objectForCreateDom = {
  htmlNew: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Form with Express</title>
    <link href="/css/style.css" type="text/css" rel="stylesheet" />
</head>
<body>
    <div>
        <h3>Чтобы зарегистрироваться - заполните данные полей:</h3>
        <form class="formForAuth" method="post" action="/main/auth/variants" target="_self" data-form="transition">            
            <div class="fields">
                <p>Введите ваш логин:</p>
                <input class="input $[inputClassLogin]" type="text" placeholder="Введите ваш логин" name="login" value="$[login]">
                <p class="$[classPLogin]">$[textPErrorLogin]</p>
            </div>
            <div class="fields">
                <p>Введите ваш пароль:</p>
                <input class="input $[inputClassPassword]" type="password" placeholder="Введите ваш пароль" name="password" value="$[password]">
                <p class="$[classPPassword]">$[textPErrorPassword]</p>
            </div>
            <div class="fields">
                <p>Введите ваш email:</p>
                <input class="input $[inputClassEmail]" type="email" placeholder="Введите ваш email" name="email" value="$[email]">
                <p class="$[classEmail]">$[textErrorEmail]</p>
            </div>
            <button type="submit">Отправить</button>
        </form>
    </div>
    <div>
        <h3>Вернуться назад:</h3>
        <form class="formforEntry" method="GET" action="/main/entry" target="_self" data-form="toEntry">
            <button type="submit">Назад</button>
        </form>
    </div>
</body>
<script type="module" src="/js/deleteKey.js"></script>
</html>`,
  htmlSuccess: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Form with Express</title>
    <link href="/css/style.css" type="text/css" rel="stylesheet" />
</head>
<body>
    <div>
        <h1>Поздравляем, $[login], вы успешно зарегистрировались! На ваш email отправлено письмо. Перейдите по ссылке указанной в письме для завершения авторизации</h1>        
    </div>
    <div>
        <form class="formforEntry" method="GET" action="/main/entry" target="_self" data-form="toEntry">
            <button type="submit">Войти</button>
        </form>
    </div>
</body>
<script type="module" src="/js/deleteKey.js"></script>
</html>`,
  htmlError: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Form with Express</title>
    <link href="/css/style.css" type="text/css" rel="stylesheet" />
</head>
<body>
    <div>
        <h1>$[status]</h1>        
    </div>
    <form class="formForAuth" method="get" action="/main/auth" target="_self" data-form="transition">            
            <button type="submit">Вернуться на страницу авторизации</button>
        </form>
</body>
<script type="module" src="/js/deleteKey.js"></script>
</html>`,
  htmlErrorTwo: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Form with Express</title>
    <link href="/css/style.css" type="text/css" rel="stylesheet" />
</head>
<body>
    <div>
        <h1>$[status]</h1>        
    </div>
    <form class="formForAuth" method="get" action="/main/entry" target="_self" data-form="toEntry">            
            <button type="submit">Вернуться на страницу входа</button>
        </form>
</body>
<script type="module" src="/js/deleteKey.js"></script>
</html>`,
};

// объект с ошибками
const objectError = {
  scriptNone: "Нельзя заполнять поле скриптом!",
  loginwrongSymbol: "Поле логин содержит недопустимые символы",
  passwordWrongSymbol: "Поле пароль содержит недопустимые символы",
  errorUndefined: "Ничего не нашлось",
  loginNull: "В поле логин ничего нет, введине логин",
  loginShort: "Логин слишком короткий",
  loginLonger: "Логин слишком длинный",
  loginAlreadyExists: "Логин уже существует, попробуйте еще раз",
  loginPasswordPairNotExist: "Пары логин пароль не существует",
  passwordNull: "В поле пароль ничего нет, введине пароль",
  passwordKirillica: "В поле пароль нельзя использовать кириллицу",
  passwordShort: "Пароль слишком короткий",
  passwordLonger: "Пароль слишком длинный",
  passwordSimple: "Пароль простой",
  passwordMedium: "Пароль средний",
  passwordHard: "Пароль сложный",
  emailNull: "В поле email ничего нет",
  emailerrorOne: "Проверьте правильность email",
};

// объект с классами
const objectCss = {
  errors: "errors",
  errorParagraf: "error_p",
  empty: "",
  success: "success",
  successParagraf: "success_p",
  simply: "simply",
  simplyParagraf: "simply_p",
  medium: "medium",
  mediumParagraf: "medium_p",
};

module.exports = {
  objectForCreateDom,
  objectError,
  objectCss,
};
