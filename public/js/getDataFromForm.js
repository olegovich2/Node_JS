import { getDatabases, postDataForRequestToDB } from "./requests.js";

const selectForListDB = document.querySelector('[data-select="listDB"]');
const formForRequest = document.querySelector(
  '[data-form="formForSendOnServer"]'
);
const textareaForRequest = document.querySelector('[name="textareaRequest"]');

export const dataToSelect = (object) => {
  selectForListDB.innerHTML = "";
  object.arrayDB.forEach((element) => {
    let newOption = new Option(`${element}`, `${element}`);
    selectForListDB.add(newOption);
  });
};

export const getDataFromForm = (event) => {
  event.preventDefault();
  const object = {};
  if (!!event.target.dataset.button) {
    object.req = textareaForRequest.value;
    object.DB = selectForListDB.value;
    postDataForRequestToDB("/reqToDB", JSON.stringify(object));
    textareaForRequest.value = "";
  }
};

formForRequest.addEventListener("click", getDataFromForm);
document.addEventListener("DOMContentLoaded", () => {
  getDatabases("/getDB");
});
