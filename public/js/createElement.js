const fieldsetForVote = document.querySelector('[data-fieldset="vote"]');
const divResult = document.querySelector('[data-div="result"]');
const divStatAndVariants = document.querySelector(
  '[data-div="statAndVariants"]'
);
const redP = document.querySelector('[data-p="red"]');
const blueP = document.querySelector('[data-p="blue"]');
const greenP = document.querySelector('[data-p="green"]');
const buttonJson = document.querySelector('[data-button="json"]');
const buttonHtml = document.querySelector('[data-button="html"]');
const buttonXml = document.querySelector('[data-button="xml"]');

// удаляем содержимое опросника
export const deleteElementsFromFieldset = () => {
  fieldsetForVote.innerHTML = "";
};

// создаем опросник
export const createElementInForm = (object) => {
  let legend = document.createElement("LEGEND");
  legend.textContent = object.title;
  fieldsetForVote.appendChild(legend);
  for (let i = 0; i < object.colours.length; i++) {
    let inputElement = document.createElement("input");
    inputElement.setAttribute("type", "radio");
    inputElement.setAttribute("name", "colour");
    inputElement.setAttribute("id", `${object.colours[i]}`);
    inputElement.setAttribute("value", `${object.colours[i]}`);
    fieldsetForVote.appendChild(inputElement);
    let labelElement = document.createElement("label");
    labelElement.setAttribute("for", `${object.colours[i]}`);
    labelElement.textContent = object.colours[i];
    fieldsetForVote.appendChild(labelElement);
    if (i === 0) inputElement.checked = true;
  }
};

// выгружаем данные статистики после голосования
export const innerPFromJson = (object) => {
  redP.innerHTML = object.red;
  blueP.innerHTML = object.blue;
  greenP.innerHTML = object.green;
};

// выгружаем данные статистики
export const createElementInDiv = (json) => {
  if (divResult.querySelector("div")) {
    let el = divResult.querySelector("div");
    el.remove("div");
  }
  if (divResult.querySelector("div") === null) {
    let divElement = document.createElement("div");
    divElement.textContent = JSON.stringify(json);
    divResult.appendChild(divElement);
  }
};

export const createElementsInDiv = (json) => {
  divStatAndVariants.querySelector("div");
  let divElement = document.createElement("div");
  divElement.textContent = JSON.stringify(json);
  divStatAndVariants.appendChild(divElement);
};

export const deleteElementsInDiv = () => {
  let allDives = divStatAndVariants.querySelectorAll("div");
  for (let i = 0; i < allDives.length; i++) {
    allDives[i].remove();
  }
};

export const download = (data, params) => {
  if (params === "json") {
    const link = document.createElement("a");
    link.href =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(data));
    link.download = `JSON-file${Date.now()}.json`;
    link.click();
  } else if (params === "html") {
    const link = document.createElement("a");
    link.href = "data:text/html;charset=utf-8," + encodeURIComponent(data);
    link.download = `HTML-file${Date.now()}.html`;
    link.click();
  } else if (params === "xml") {
    const link = document.createElement("a");
    link.href = "data:text/xml;charset=utf-8," + encodeURIComponent(data);
    link.download = `XML-file${Date.now()}.xml`;
    link.click();
  }
};
