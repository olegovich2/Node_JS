import { handleRespiratory } from "../constants/respiratory.js";
import {
  clearResultSurvey,
  handleResultSurveyMain,
} from "./allFunctionsForWorkMain.js";
import { elementsForSurveys } from "../constants/allConstants.js";
import { redirectToAccount, checkJWT } from "./requestsForSurveys.js";

// навигационные кнопки для включения форм
export const allTabs = document.querySelector('[data-nav="allTabs"]');
export const tabGeneral = document.querySelector('[data-list="general"]');
export const tabRespiratory = document.querySelector(
  '[data-list="respiratory"]'
);
export const tabCardiovascular = document.querySelector(
  '[data-list="cardiovascular"]'
);
export const tabDigestive = document.querySelector('[data-list="digestive"]');
export const tabUrinary = document.querySelector('[data-list="urinary"]');
export const tabMusculoskeletal = document.querySelector(
  '[data-list="musculoskeletal"]'
);

// контейнеры форм
export const listGeneral = document.querySelector("#general");
export const listRespiratory = document.querySelector("#respiratory");
export const listCardiovascular = document.querySelector("#cardiovascular");
export const listDigestive = document.querySelector("#digestive");
export const listUrinary = document.querySelector("#urinary");
export const listMusculoskeletal = document.querySelector("#musculoskeletal");
export const sections = document.querySelectorAll("section");

// форма дыхательной системы
export const formFromRespiratoryAnamnesis = document.querySelector(
  '[data-form="respiratory"]'
);

// контейнер для кнопок перехода между страницами
export const containerForButtonsInHeader = document.querySelector(
  '[data-container="buttons"]'
);

// контейнер готового осмотра на /main
export const resultSurvey = document.querySelector(
  elementsForSurveys.baseSurvey.elementPath
);

// прослушка кнопок в хэдере
containerForButtonsInHeader.addEventListener("click", (event) => {
  event.preventDefault();
  if (
    event.target.dataset.button === "toAccount" ||
    event.target.classList.contains("fa-receipt")
  ) {
    if (localStorage.getItem("user") === null) {
      redirectToEntry();
    } else redirectToAccount("/toAccount");
  }
  if (
    event.target.dataset.button === "toEntry" ||
    event.target.classList.contains("fa-xmark")
  ) {
    redirectToEntry();
  }
});

// прослушка кнопок навигации
allTabs.addEventListener("click", (event) => {
  sections.forEach((element) => {
    if (
      element.classList.contains("unvisible") &&
      element.id === event.target.dataset.list
    )
      element.classList.remove("unvisible");
    else if (
      !element.classList.contains("unvisible") &&
      element.id === event.target.dataset.list
    )
      element.classList.add("unvisible");
    else if (
      !element.classList.contains("unvisible") &&
      element.id !== event.target.dataset.list
    )
      element.classList.add("unvisible");
  });

  // логика открытия и сокрытия контейнеров(при развитии сайта - навешивание и удаление прослушек)
  if (!listGeneral.classList.contains("unvisible")) {
    tabGeneral.classList.add("active");
    if (!resultSurvey.classList.contains("unvisible"))
      resultSurvey.classList.add("unvisible");
  }
  if (listGeneral.classList.contains("unvisible"))
    tabGeneral.classList.remove("active");

  if (!listRespiratory.classList.contains("unvisible")) {
    tabRespiratory.classList.add("active");
    if (!resultSurvey.classList.contains("unvisible"))
      resultSurvey.classList.add("unvisible");
    formFromRespiratoryAnamnesis.addEventListener("submit", handleRespiratory);
    formFromRespiratoryAnamnesis.scrollIntoView({
      block: "start",
      inline: "nearest",
    });
  }
  if (listRespiratory.classList.contains("unvisible")) {
    tabRespiratory.classList.remove("active");
    formFromRespiratoryAnamnesis.removeEventListener(
      "submit",
      handleRespiratory
    );
  }

  if (!listCardiovascular.classList.contains("unvisible")) {
    tabCardiovascular.classList.add("active");
    if (!resultSurvey.classList.contains("unvisible"))
      resultSurvey.classList.add("unvisible");
  }
  if (listCardiovascular.classList.contains("unvisible"))
    tabCardiovascular.classList.remove("active");

  if (!listDigestive.classList.contains("unvisible")) {
    tabDigestive.classList.add("active");
    if (!resultSurvey.classList.contains("unvisible"))
      resultSurvey.classList.add("unvisible");
  }
  if (listDigestive.classList.contains("unvisible"))
    tabDigestive.classList.remove("active");

  if (!listUrinary.classList.contains("unvisible")) {
    tabUrinary.classList.add("active");
    if (!resultSurvey.classList.contains("unvisible"))
      resultSurvey.classList.add("unvisible");
  }
  if (listUrinary.classList.contains("unvisible"))
    tabUrinary.classList.remove("active");

  if (!listMusculoskeletal.classList.contains("unvisible")) {
    tabMusculoskeletal.classList.add("active");
    if (!resultSurvey.classList.contains("unvisible"))
      resultSurvey.classList.add("unvisible");
  }
  if (listMusculoskeletal.classList.contains("unvisible"))
    tabMusculoskeletal.classList.remove("active");

  // очистка результата осмотра
  if (resultSurvey.classList.contains("unvisible")) {
    clearResultSurvey(elementsForSurveys.baseSurvey);
    if (localStorage.getItem("survey")) localStorage.removeItem("survey");
    if (typeof resultSurvey.addEventListener === "function") {
      resultSurvey.removeEventListener("click", handleResultSurveyMain);
    }
  }
});

// редирект на страницу входа
export const redirectToEntry = () => {
  const link = document.createElement("a");
  link.href = "/main/entry";
  localStorage.clear();
  link.click();
};

// при загрузке страницы выполняется проверка
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("user") === null) {
    redirectToEntry();
  } else checkJWT("/checkJWT");
});
