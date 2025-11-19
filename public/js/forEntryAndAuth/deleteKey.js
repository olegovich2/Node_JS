document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("user")) {
    localStorage.removeItem("user");
  }
  if (localStorage.getItem("allSurveys")) {
    localStorage.removeItem("allSurveys");
  }
  if (localStorage.getItem("originImage")) {
    localStorage.removeItem("originImage");
  }
});
