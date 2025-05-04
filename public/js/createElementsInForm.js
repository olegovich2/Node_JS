import {
  getDataForMarkerField,
  postData,
  getDataForForm,
  deleteMarkerFormList,
  postDataForFetchApi,
} from "./requests.js";

const stringHeaders =
  "Accept,Accept-Charset,Accept-Encoding,Accept-Language,Authorization,Content-Disposition,Expect,From,Host,If-Match,If-Modified-Since,If-None-Match,If-Range,If-Unmodified-Since,Max-Forwards,Proxy-Authorization,Referer,User-Agent";
const headersValue =
  'Content-Disposition: form-data; name="MessageTitle", Accept-Charset: utf-8, Accept: text/plain и тд';
const regularKirillica = /[а-яА-ЯёЁ\s\.\,\!\?]/gm;
let compare = "";
export const formOne = document.querySelector('[data-form="formOne"]');
const divHeadersField = document.querySelector('[data-div="headers"]');
const divParamsField = document.querySelector('[data-div="params"]');
const divBodyRequest = document.querySelector('[data-div="bodyRequest"]');
const divModuleParams = document.querySelector('[data-div="module_params"]');
export const divFieldMarker = document.querySelector(
  '[data-div="field_marker"]'
);
const buttonSave = formOne.querySelector('[data-button="save_request"]');
export const resultFromServer = document.querySelector('[data-div="result"]');

export const handleFormForRequests = (event) => {
  event.preventDefault();
  const selectValue = formOne.querySelector(
    '[data-select="selectMethod"]'
  ).value;
  if (compare !== selectValue) {
    compare = selectValue;
    showHide(selectValue);
  }
  if (event.target.dataset.button === "add_headers")
    createInputsAndButton(divHeadersField, "headers");
  if (event.target.dataset.button === "add_params")
    createInputsAndButton(divParamsField, "params");
  if (
    event.target.dataset.button &&
    event.target.dataset.button.includes("delete")
  ) {
    const dataButton = event.target;
    deleteHeadersOrParams(dataButton);
  }
  if (event.target.dataset.button === "save_request") {
    const gap = searchMalware();
    if (gap) {
      const objectForSend = generateObjectForMarker(
        event.target.dataset.originalKey
      );
      postData("/write", JSON.stringify(objectForSend));
    }
  }
  if (event.target.dataset.button === "send_request") {
    const gap = searchMalware();
    if (gap) {
      const data = createDataForSendApi();
      postDataForFetchApi("/dataForFetch", JSON.stringify(data));
    }
  }
  if (event.target.dataset.button === "clear_form") {
    clearForm();
  }
};

const showHide = (selectValue) => {
  if (selectValue !== "POST" || selectValue !== "PATCH") {
    if (divBodyRequest.className !== "unvisible")
      divBodyRequest.classList.add("unvisible");
    divModuleParams.classList.remove("unvisible");
  }
  if (selectValue === "POST" || selectValue === "PATCH") {
    divBodyRequest.classList.remove("unvisible");
    if (divModuleParams.className !== "unvisible")
      divModuleParams.classList.add("unvisible");
  }
};

const deleteHeadersOrParams = (dataset) => {
  const div = dataset.closest(".new_div");
  div.remove();
};

const createInputsAndButton = (nameField, params, fromDB) => {
  const div = document.createElement("div");
  const inputOne = document.createElement("input");
  const inputTwo = document.createElement("input");
  const button = document.createElement("button");
  div.className = "new_div";
  inputOne.setAttribute("type", "text");
  inputOne.setAttribute("placeholder", "Введите заголовок");
  inputOne.setAttribute("title", `${stringHeaders}`);
  inputTwo.setAttribute("type", "text");
  inputTwo.setAttribute("placeholder", "Введите значение заголовка");
  inputTwo.setAttribute("title", `${headersValue}`);
  button.setAttribute("type", "button");
  button.className = "delete_headers";
  button.textContent = "Удалить";
  if (!fromDB) {
    const random = Math.floor(Math.random() * 10000);
    div.setAttribute("id", `div${random}`);
    inputOne.setAttribute("name", `${params}${random}`);
    inputTwo.setAttribute("name", `${params}Value${random}`);
    button.dataset.button = `delete_${params}${random}`;
  } else {
    div.setAttribute("id", `div${fromDB}`);
    inputOne.setAttribute("name", `${params}${fromDB}`);
    inputTwo.setAttribute("name", `${params}Value${fromDB}`);
    button.dataset.button = `delete_${params}${fromDB}`;
  }
  div.appendChild(inputOne);
  div.appendChild(inputTwo);
  div.appendChild(button);
  nameField.appendChild(div);
};

const searchMalware = () => {
  const allValueFromForm = document.querySelectorAll("input, select, textarea");
  for (let q = 0; q < allValueFromForm.length; q++) {
    if (allValueFromForm[q].name === "method") {
      // поле метод
      searchWrongStringAndSymbols(
        allValueFromForm[q],
        allValueFromForm[q].value
      );
      if (allValueFromForm[q].value.length === 0) {
        if (!allValueFromForm[q].classList.contains("error"))
          allValueFromForm[q].classList.add("error");
      }
    } else if (
      (allValueFromForm[q].name === "urlFromForm" &&
        !allValueFromForm[q].checkValidity()) ||
      (allValueFromForm[q].name === "urlFromForm" &&
        allValueFromForm[q].value.length === 0)
    ) {
      // поле урл
      if (!allValueFromForm[q].classList.contains("error"))
        allValueFromForm[q].classList.add("error");
    } else if (allValueFromForm[q].name === "textareaBodyRequest") {
      // поле тело запроса
      searchWrongStringAndSymbols(
        allValueFromForm[q],
        allValueFromForm[q].value
      );
    } else if (
      allValueFromForm[q].name.includes("params") ||
      allValueFromForm[q].name.includes("headers")
    ) {
      // поля параметров и заголовков
      if (allValueFromForm[q].classList.contains("error"))
        allValueFromForm[q].classList.remove("error");
      searchWrongStringAndSymbols(
        allValueFromForm[q],
        allValueFromForm[q].value
      );
      if (allValueFromForm[q].value.length === 0) {
        if (!allValueFromForm[q].classList.contains("error"))
          allValueFromForm[q].classList.add("error");
      }
    } else {
      // в случае успеха
      if (allValueFromForm[q].classList.contains("error"))
        allValueFromForm[q].classList.remove("error");
    }
  }
  for (let q = 0; q < allValueFromForm.length; q++) {
    if (allValueFromForm[q].classList.contains("error")) return false;
  }
  return true;
};

const searchWrongStringAndSymbols = (element, value) => {
  if (value.includes("<script>") || value.includes("</script>")) {
    if (!element.classList.contains("error")) element.classList.add("error");
  }
  if (value.includes("<") || value.includes(">") || value.includes("&")) {
    if (!element.classList.contains("error")) element.classList.add("error");
  }
  if (regularKirillica.test(value) && element.name !== "urlFromForm") {
    if (!element.classList.contains("error")) element.classList.add("error");
  }
};

const generateObjectForMarker = (originalKey) => {
  const allValueFromForm = document.querySelectorAll("input, select, textarea");
  const objectForSave = {};
  for (let q = 0; q < allValueFromForm.length; q++) {
    objectForSave[allValueFromForm[q].name] = allValueFromForm[q].value;
  }
  objectForSave.originalKey = originalKey;
  return objectForSave;
};

const createDataForSendApi = () => {
  const allValueFromForm = document.querySelectorAll("input, select, textarea");
  const object = {};
  let params = "";
  let headers = {};
  for (let q = 0; q < allValueFromForm.length; q++) {
    if (
      allValueFromForm[q].name === "method" ||
      allValueFromForm[q].name === "textareaBodyRequest"
    ) {
      // поле метод
      object[allValueFromForm[q].name] = allValueFromForm[q].value;
    } else if (allValueFromForm[q].name === "urlFromForm") {
      // поле урл
      object.url = allValueFromForm[q].value;
    } else if (
      allValueFromForm[q].name.includes("params") &&
      !allValueFromForm[q].name.includes("paramsValue")
    ) {
      // поля параметров
      params += allValueFromForm[q].value + "=";
    } else if (allValueFromForm[q].name.includes("paramsValue")) {
      // поля параметров
      params += allValueFromForm[q].value + "&";
    } else if (
      allValueFromForm[q].name.includes("headers") &&
      !allValueFromForm[q].name.includes("headersValue")
    ) {
      // поля заголовков
      headers[allValueFromForm[q].value] = `headersValue${allValueFromForm[
        q
      ].name.replace("headers", "")}`;
    } else if (allValueFromForm[q].name.includes("headersValue")) {
      // поля заголовков
      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          if (headers[key] === allValueFromForm[q].name) {
            headers[key] = allValueFromForm[q].value;
          }
        }
      }
    }
  }
  params = params.slice(0, -1);
  object.params = params;
  object.headers = headers;
  return object;
};

export const clearForm = () => {
  const select = formOne.querySelector('[data-select="selectMethod"]');
  const url = formOne.querySelector('[name="urlFromForm"]');
  const textarea = formOne.querySelector('[name="textareaBodyRequest"]');
  const paramsDiv = formOne.querySelector('[data-div="params"]');
  const headersDiv = formOne.querySelector('[data-div="headers"]');

  select.value = "";
  url.value = "";
  textarea.value = "";
  paramsDiv.innerHTML = "";
  headersDiv.innerHTML = "";
  buttonSave.dataset.originalKey = "";
  buttonSave.classList.remove("unvisible");
};

export const generateMarkerInField = (object, date) => {
  const moduleTemplate = document.querySelector(
    '[data-template="template_marker"]'
  )?.content;
  const clone = moduleTemplate.childNodes[1].cloneNode(true);
  if (object.method === "GET") clone.classList.add("red");
  if (object.method === "POST") clone.classList.add("blue");
  if (object.method === "PATCH") clone.classList.add("green");
  if (object.method === "UPDATE") clone.classList.add("violet");
  if (object.method === "OPTIONS") clone.classList.add("white");
  if (object.method === "") clone.classList.add("grey");
  clone.dataset.id = date;
  clone.querySelector('[data-p="method"]').textContent = object.method;
  clone.querySelector('[data-p="url"]').textContent = object.url;
  clone.querySelector('[data-button="edit_marker"]').dataset.id = date;
  clone.querySelector('[data-button="open_marker"]').dataset.id = date;
  clone.querySelector('[data-button="delete_marker"]').dataset.id = date;
  divFieldMarker.appendChild(clone);
};

export const clearAndGenerateMarkers = (object) => {
  divFieldMarker.innerHTML = "";
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      generateMarkerInField(object[key], key);
    }
  }
};

export const manualControlFieldMarker = (event) => {
  event.preventDefault();
  if (event.target.dataset.button === "edit_marker") {
    const object = {};
    object.id = event.target.dataset.id;
    clearForm();
    getDataForForm("/openMarker", JSON.stringify(object));
    buttonSave.dataset.originalKey = event.target.dataset.id;
  }
  if (event.target.dataset.button === "open_marker") {
    const object = {};
    object.id = event.target.dataset.id;
    clearForm();
    getDataForForm("/openMarker", JSON.stringify(object));
    if (!buttonSave.classList.contains("unvisible")) {
      buttonSave.classList.add("unvisible");
    }
  }
  if (event.target.dataset.button === "delete_marker") {
    const object = {};
    object.id = event.target.dataset.id;
    clearForm();
    deleteMarkerFormList("/delete", JSON.stringify(object));
  }
};

export const dataEntryInFormFromDB = (object) => {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      if (key === "method") {
        const select = formOne.querySelector('[data-select="selectMethod"]');
        select.value = object[key];
        showHide(object[key]);
      }
      if (key === "urlFromForm") {
        const url = formOne.querySelector('[name="urlFromForm"]');
        url.value = object[key];
      }
      if (key === "textareaBodyRequest") {
        const bodyRequest = formOne.querySelector(
          '[name="textareaBodyRequest"]'
        );
        bodyRequest.value = object[key];
      }
      if (key.includes("params") && !key.includes("paramsValue")) {
        createInputsAndButton(
          divParamsField,
          "params",
          key.replace("params", "")
        );
        const params = formOne.querySelector(`[name='${key}']`);
        params.value = object[key];
      }
      if (key.includes("paramsValue")) {
        if (formOne.querySelector(`[name='${key}']`)) {
          const params = formOne.querySelector(`[name='${key}']`);
          params.value = object[key];
        } else {
          createInputsAndButton(
            divParamsField,
            "params",
            key.replace("paramsValue", "")
          );
        }
      }
      if (key.includes("headers") && !key.includes("headersValue")) {
        createInputsAndButton(
          divHeadersField,
          "headers",
          key.replace("headers", "")
        );
        const headers = formOne.querySelector(`[name='${key}']`);
        headers.value = object[key];
      }
      if (key.includes("headersValue")) {
        if (formOne.querySelector(`[name='${key}']`)) {
          const headers = formOne.querySelector(`[name='${key}']`);
          headers.value = object[key];
        } else {
          createInputsAndButton(
            divHeadersField,
            "headers",
            key.replace("headersValue", "")
          );
        }
      }
    }
  }
};

export const createResult = (object) => {
  resultFromServer.innerHTML = "";
  const hContent = document.createElement("h3");
  hContent.textContent = "Статус:";
  const pStatus = document.createElement("p");
  pStatus.textContent = object.status;
  resultFromServer.append(hContent);
  resultFromServer.append(pStatus);
  const headersContent = document.createElement("h4");
  headersContent.textContent = "Заголовки:";
  resultFromServer.append(headersContent);
  for (const key in object.headers) {
    if (object.headers.hasOwnProperty(key)) {
      if (key === "set-cookie") {
        let elementContent = `${key}: длинный ключ`;
        let elementP = document.createElement("p");
        elementP.textContent = elementContent;
        resultFromServer.append(elementP);
      } else {
        let elementContent = `${key}:${object.headers[key]}`;
        let elementP = document.createElement("p");
        elementP.textContent = elementContent;
        resultFromServer.append(elementP);
      }
    }
  }
  const bodyAnswerContent = document.createElement("h4");
  bodyAnswerContent.textContent = "Тело ответа:";
  resultFromServer.append(bodyAnswerContent);
  const bodyAnswerContainer = document.createElement("textarea");
  bodyAnswerContainer.setAttribute("rows", "5");
  bodyAnswerContainer.setAttribute("cols", "55");
  bodyAnswerContainer.value = JSON.stringify(object.body);
  resultFromServer.append(bodyAnswerContainer);
  const previewAnswerContent = document.createElement("h4");
  previewAnswerContent.textContent = "Preview:";
  resultFromServer.append(previewAnswerContent);
  if (object.hasOwnProperty("image")) {
    const img = document.createElement("img");
    img.setAttribute("height", "150px");
    img.setAttribute("width", "150px");
    let base64String = `data:image/png;base64,${object.page}`;
    const base64Data = base64String.split(",")[1];
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    img.src = url;
    resultFromServer.appendChild(img);
    URL.revokeObjectURL(blob);
  } else {
    const previewAnswerContainer = document.createElement("textarea");
    previewAnswerContainer.setAttribute("rows", "5");
    previewAnswerContainer.setAttribute("cols", "55");
    previewAnswerContainer.value = object.page;
    resultFromServer.append(previewAnswerContainer);
  }
};

divFieldMarker.addEventListener("click", manualControlFieldMarker);
formOne.addEventListener("click", handleFormForRequests);
document.addEventListener("DOMContentLoaded", getDataForMarkerField("/marker"));
