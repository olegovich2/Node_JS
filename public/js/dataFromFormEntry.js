import { postDataForVerify } from "./requests.js";
const formEntry = document.querySelector('[data-form="entry"]');
const inputLogin = document.querySelector('[data-input="login"]');
const inputPass = document.querySelector('[data-input="pass"]');

const handleGetDataFromEntry = (event) => {
  event.preventDefault();
  if (event.target.dataset.button === "entry") {
    const object = {};
    object.login = inputLogin.value;
    object.password = inputPass.value;
    postDataForVerify("/entryData", JSON.stringify(object));
    formEntry.reset();
  }
};

formEntry.addEventListener("click", handleGetDataFromEntry);
