import { elementsForSurveys } from "../constants/allConstants.js";
// html для создания ссылок к осмотрам
export const templateSurveyWithDate = document.querySelector(
  '[data-template="allSurveyFromDB"]'
);
// контейнер для ссылок осмотров
export const divForPieces = document.querySelector(
  '[data-container="allSurveyFromDB"]'
);
// контейнер для ссылок картинок
export const divImages = document.querySelector(
  '[data-div="allDownloadImages"]'
);
// html для создания ссылок к картинкам
export const templateImages = document.querySelector(
  '[data-template="allImagesFromDB"]'
);
// html для оригинальной картинки
export const templateOrigin = document.querySelector(
  '[data-template="originImagesFromDB"]'
);
// контейнер для ориджин
export const originToMain = document.querySelector(
  '[data-div="visibilityImage"]'
);

// редирект на страницу входа
export const redirectToEntry = () => {
  const link = document.createElement("a");
  link.href = "/main/entry";
  localStorage.clear();
  link.click();
};

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

// распаковка осмотров и фото из БД
export const objectToLIstSurveysAndImages = (object) => {
  divForPieces.innerHTML = "";
  divImages.innerHTML = "";
  const keysSurveys = Object.keys(object.surveys);
  for (let i = keysSurveys.length - 1; i >= 0; i--) {
    const key = keysSurveys[i];
    pickingUpPieces(key, JSON.parse(object.surveys[key]).date);
  }
  const allSurveys = object.surveys;
  localStorage.setItem("allSurveys", JSON.stringify(allSurveys));
  const keysImages = Object.keys(object.images);
  for (let i = keysImages.length - 1; i >= 0; i--) {
    const key = keysImages[i];
    imageToContainer(key, object.images[key]);
  }
};

// конструктор ссылок на осмотры
export const pickingUpPieces = (id, date) => {
  const divContainer =
    templateSurveyWithDate.content.children[0].cloneNode(true);
  divContainer.dataset.div = id;
  divContainer.querySelector('[data-container="lookButton"]').dataset.id = id;
  divContainer.querySelector('[data-container="deleteButton"]').dataset.id = id;
  divContainer.querySelector('[data-container="date"]').textContent = date;
  divForPieces.appendChild(divContainer);
};

// конструктор данных изображения
export const imageToContainer = (id, object) => {
  const divContainerImages = templateImages.content.children[0].cloneNode(true);
  divContainerImages.dataset.div = id;
  divContainerImages.querySelector(
    '[data-container="lookButtonImages"]'
  ).dataset.id = id;
  divContainerImages.querySelector(
    '[data-container="deleteButtonImages"]'
  ).dataset.id = id;
  divContainerImages.querySelector('[data-container="filename"]').textContent =
    object.fileNameOriginIMG;
  divContainerImages.querySelector('[data-container="comment"]').textContent =
    object.comment;
  divContainerImages.querySelector('[data-img="fromDB"]').src =
    `data:image/png;base64,${object.smallIMG}`;
  divImages.appendChild(divContainerImages);
};

// конструктор оригинального изображения
export const imageToBlock = (object) => {
  localStorage.setItem("originImage", JSON.stringify(object));
  const divContainerForOriginImage =
    templateOrigin.content.children[0].cloneNode(true);
  // divContainerForOriginImage.dataset.div = object.id;
  divContainerForOriginImage.querySelector('[data-img="originfromDB"]').src =
    `data:image/png;base64,${object.originIMG}`;
  divContainerForOriginImage.querySelector(
    '[data-container="downloadButtonImages"]'
  ).dataset.id = object.id;
  divContainerForOriginImage.querySelector(
    '[data-container="closeOriginImage"]'
  ).dataset.id = object.id;
  originToMain.appendChild(divContainerForOriginImage);
};

// загрузка и закрытие оригинального изображения
export const closeAndDownloadOriginImage = (option) => {
  if (option === "close") {
    originToMain.innerHTML = "";
  } else {
    const object = JSON.parse(localStorage.getItem("originImage"));
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${object.originIMG}`;
    link.download = object.filename;
    link.click();
  }
};
