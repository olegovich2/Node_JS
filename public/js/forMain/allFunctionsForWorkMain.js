import { elementsForSurveys } from "../constants/allConstants.js";

const containerForButtonsInHeader = document.querySelector(
  '[data-container="buttons"]'
);
const tabRespiratory = document.querySelector('[data-list="respiratory"]');
const listRespiratory = document.querySelector("#respiratory");
const resultSurvey = document.querySelector(
  elementsForSurveys.baseSurvey.elementPath
);
// на печать
export const callPrint = (id) => {
  const prtContent = document.querySelector(id);
  const WinPrint = window.open(
    "",
    "",
    "left=50,top=50,width=800,height=640,toolbar=0,scrollbars=1,status=0"
  );
  WinPrint.document.write("");
  WinPrint.document.write(prtContent.innerHTML);
  WinPrint.document.write("");
  WinPrint.document.close();
  WinPrint.focus();
  WinPrint.print();
  WinPrint.close();
};

// сохранить как документ на ПК
export const exportHTML = (id) => {
  let date;
  const header =
    "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
    "xmlns:w='urn:schemas-microsoft-com:office:word' " +
    "xmlns='http://www.w3.org/TR/REC-html40'>" +
    "<head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
  const footer = "</body></html>";
  const docSave = document.querySelector(id);
  const sourceHTML = header + docSave.innerHTML + footer;
  if (id === "#printFromAccount") {
    date = docSave
      .querySelector(elementsForSurveys.surveyFromAccount.date)
      .textContent.split(", ")
      .join("_");
  }
  if (id === "#print") {
    date = docSave
      .querySelector(elementsForSurveys.baseSurvey.date)
      .textContent.split(", ")
      .join("_");
  }
  const source =
    "data:application/vnd.ms-word;charset=utf-8," +
    encodeURIComponent(sourceHTML);
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = `Результат_опроса_от_${date}.doc`;
  fileDownload.click();
  document.body.removeChild(fileDownload);
};

// работа с результатом осмотра на /main
export const handleResultSurveyMain = (event) => {
  event.preventDefault();
  if (event.target.dataset.button === "print") {
    callPrint("#print");
  }
  if (event.target.dataset.button === "saveAs") {
    exportHTML("#print");
  }
  if (event.target.dataset.button === "saveData") {
    const data = {};
    data.login = JSON.parse(localStorage.getItem("user")).login;
    const dataTwo = objectForSaveSurveyOnDB();
    justAsk("/justAsk", JSON.stringify(data), "/toPersonalDB", dataTwo);
  }
  if (event.target.dataset.button === "closeResultSurvey") {
    if (!resultSurvey.classList.contains("unvisible"))
      resultSurvey.classList.add("unvisible");
    clearResultSurvey(elementsForSurveys.baseSurvey);
    containerForButtonsInHeader.scrollIntoView({
      block: "start",
      inline: "nearest",
    });
    if (localStorage.getItem("survey")) localStorage.removeItem("survey");
    if (typeof resultSurvey.addEventListener === "function") {
      resultSurvey.removeEventListener("click", handleResultSurveyMain);
    }
  }
};

// перезапись осмотра лежащего в localstorage
export const rewriteSurveyLocalStorage = (object) => {
  const oldObject = JSON.parse(localStorage.getItem("survey"));
  oldObject.title = object.title;
  oldObject.diagnostic = object.diagnostic;
  oldObject.treatment = object.treatment;
  createElementsResultSurvey(oldObject, elementsForSurveys.baseSurvey);
  listRespiratory.classList.add("unvisible");
  tabRespiratory.classList.remove("active");
  resultSurvey.classList.remove("unvisible");
  resultSurvey.scrollIntoView({ block: "start", inline: "nearest" });
  localStorage.setItem("survey", JSON.stringify(oldObject));
  resultSurvey.addEventListener("click", handleResultSurveyMain);
};

// объект для сохранения осмотра на сервере
export const objectForSaveSurveyOnDB = () => {
  const object = {};
  object.login = JSON.parse(localStorage.getItem("user")).login;
  object.survey = localStorage.getItem("survey");
  return JSON.stringify(object);
};

// заполнение осмотра
export const createElementsResultSurvey = (object, path) => {
  const resultSurvey = document.querySelector(path.elementPath);
  resultSurvey.querySelector(path.date).textContent = object.date;
  resultSurvey.querySelector(path.name).textContent = object.nameSurname;
  resultSurvey.querySelector(path.age).textContent = object.age;
  resultSurvey.querySelector(path.temperature).textContent = object.temperature;
  resultSurvey.querySelector(path.overview).textContent = object.anamnesis;
  resultSurvey.querySelector(path.listDiagnosis).textContent =
    object.title.join(" ");
  resultSurvey.querySelector(path.diagnostics).textContent =
    object.diagnostic.join(", ");
  resultSurvey.querySelector(path.treatment).textContent =
    object.treatment.join(", ");
  resultSurvey.querySelector(path.otherGuidelines).textContent =
    object.otherGuidelines.join(" ");
};

// очистка осмотра
export const clearResultSurvey = (path) => {
  const resultSurvey = document.querySelector(path.elementPath);
  resultSurvey.querySelector(path.date).textContent = "";
  resultSurvey.querySelector(path.name).textContent = "";
  resultSurvey.querySelector(path.age).textContent = "";
  resultSurvey.querySelector(path.temperature).textContent = "";
  resultSurvey.querySelector(path.overview).textContent = "";
  resultSurvey.querySelector(path.listDiagnosis).textContent = "";
  resultSurvey.querySelector(path.diagnostics).textContent = "";
  resultSurvey.querySelector(path.treatment).textContent = "";
  resultSurvey.querySelector(path.otherGuidelines).textContent = "";
};

// большие буквы в фио
export const formatedSymbolInName = (nameSurname) => {
  if (nameSurname.length > 0) {
    const arrayFromNameSurname = nameSurname.toLowerCase().split(" ");
    const newNameSurname = [];
    for (let i = 0; i < arrayFromNameSurname.length; i++) {
      const newArray = arrayFromNameSurname[i].split("");
      newArray[0] = newArray[0].toUpperCase();
      const newArray1 = newArray.join("");
      newNameSurname.push(newArray1);
    }
    return newNameSurname.join(" ");
  } else return "";
};

// форматирование анамнеза
export const historyTaking = (array) => {
  let overview = "";
  array.forEach((element) => {
    if (element.tagName === "FIELDSET") {
      if (
        element.dataset.fieldset === "nameSurname" ||
        element.dataset.fieldset === "age" ||
        element.dataset.fieldset === "temperature"
      );
      else overview += `${element.childNodes[1].textContent}: `;
    }
    if (element.tagName === "INPUT" && element.checked) {
      let label = document.querySelector(`[for="${element.id}"]`);
      overview += `${label.textContent}. `;
    }
    if (element.tagName === "INPUT" && element.type === "text") {
      if (
        element.id === "nameSurname" ||
        element.id === "age" ||
        element.id === "temperature"
      );
      else overview += `${element.value}. `;
    }
  });
  return overview;
};

// складываем в персональную базу данных осмотр
export async function postSurveyToPersonalDB(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).jwt_access}`,
    },
    body: data,
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        if (response.ok)
          alert("Данные успешно записаны и отобразятся в личном кабинете");
        else throw new Error("Запись данных завершилась неудачей");
      }
    })
    .catch((error) => {
      console.error(error);
      alert(error);
    });
  return answer;
}

// узнаем существует ли БД
export async function justAsk(url, data, url2, data2) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).jwt_access}`,
    },
    body: data,
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        if (response.ok) {
          postSurveyToPersonalDB(url2, data2);
        } else throw new Error("Получение рекомендаций завершилось неудачей");
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}
