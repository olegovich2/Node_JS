const fieldsetForVote = document.querySelector('[data-fieldset="vote"]');
const divResult = document.querySelector('[data-div="result"]');

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

// выгружаем данные статистики
export const createElementInDiv = (json) => {
  if (divResult.querySelector("div")) {
    let el = divResult.querySelector("div");
    el.remove("div");
  }
  if (divResult.querySelector("div") === null) {
    divResult.querySelector("div");
    let divElement = document.createElement("div");
    divElement.textContent = JSON.stringify(json);
    divResult.appendChild(divElement);
  }
};
