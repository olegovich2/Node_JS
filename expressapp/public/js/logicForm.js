import {
  deleteElementsFromFieldset,
  createElementInForm,
  createElementInDiv,
} from "./createElement.js";

// переменные для работы форм
const divTransition = document.querySelector('[data-div="transition"]');
const formTransition = document.querySelector('[data-form="transition"]');
const divVote = document.querySelector('[data-div="vote"]');
const formVote = document.querySelector('[data-form="vote"]');
const formResult = document.querySelector('[data-form="result"]');

// работа формы перехода к голосованию
formTransition.addEventListener("submit", (event) => {
  event.preventDefault();
  console.log(event.target);

  divTransition.classList.add("unvisible");
  getData("/variants");
  divVote.classList.remove("unvisible");
});

// работа формы для голосования
formVote.addEventListener("submit", (event) => {
  event.preventDefault();
  const personalVote = {};
  const nameColour = event.target.elements.colour.value;
  personalVote.colour = nameColour;
  postData("/vote", JSON.stringify(personalVote));
  formVote.reset();
  divVote.classList.add("unvisible");
  divTransition.classList.remove("unvisible");
});

// работа формы статистики
formResult.addEventListener("submit", (event) => {
  event.preventDefault();
  postDataForStat("/stat");
});

//получаем данные для опросника
const getData = (url) => {
  return fetch(url)
    .then((response) => {
      if (response.ok) return response.json();
      else throw new Error("Получение данных завершилось неудачей");
    })
    .then((result) => {
      deleteElementsFromFieldset();
      createElementInForm(result);
    })
    .catch((error) => {
      console.error(error);
    });
};

// отправляем результат голосования
async function postData(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  })
    .then((response) => {
      if (response.ok) return response.json();
      else throw new Error("Получение данных завершилось неудачей");
    })
    .then((result) => {
      alert("Ваш голос успешно зарегистрирован");
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

// отправляем запрос на статистику
async function postDataForStat(url) {
  const answer = await fetch(url, {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) return response.json();
      else throw new Error("Получение данных завершилось неудачей");
    })
    .then((result) => {
      createElementInDiv(result);
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}
