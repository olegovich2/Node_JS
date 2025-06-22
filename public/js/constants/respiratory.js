import { titleStates } from "./allConstants.js";
import { postTitlesForListRecomFromDB } from "../forMain/requestsForSurveys.js";
import {
  formatedSymbolInName,
  historyTaking,
} from "../forMain/allFunctionsForWorkMain.js";

const formFromRespiratoryAnamnesis = document.querySelector(
  '[data-form="respiratory"]'
);
// сбор и интерпретация информации из формы дыхательная система
export const handleRespiratory = (event) => {
  event.preventDefault();
  const personalData = {};
  const mixDiagnoses = [];
  const otherGuidelines = [];
  const date = new Date();
  personalData.date = date.toLocaleString("en-US", { hour12: false });

  const nameSurname = event.target.elements.nameSurname.value;
  personalData.nameSurname = nameSurname;

  const age = Number(event.target.elements.age.value);
  personalData.age = age;

  const temperature = Number(event.target.elements.temperature.value);
  personalData.temperature = `${temperature}\u00B0C`;

  const weightBody = Number(event.target.elements.weightBody.value);
  otherGuidelines.push(`Обильное питье в объеме ${weightBody * 30}мл в сутки.`);

  const soreThroat = Number(event.target.elements.soreThroat.value);
  const plaquesTonsils = Number(event.target.elements.plaquesTonsils.value);
  const runnyNose = Number(event.target.elements.runnyNose.value);
  const pollinosis = Number(event.target.elements.pollinosis.value);
  let cough = Number(event.target.elements.cough.value);

  const dyspnoea = Number(event.target.elements.dyspnoea.value);
  const sputum = Number(event.target.elements.sputum.value);
  const hemoptysis = Number(event.target.elements.hemoptysis.value);
  const chestPainBreathing = Number(
    event.target.elements.chestPainBreathing.value
  );
  const daysDisease = Number(event.target.elements.daysDisease.value);
  const frequentPneumonia = Number(
    event.target.elements.frequentPneumonia.value
  );
  const bronchialAsthmaAnamnesis = Number(
    event.target.elements.bronchialAsthmaAnamnesis.value
  );
  const bronchialAsthmaConfirmed = Number(
    event.target.elements.bronchialAsthmaConfirmed.value
  );
  const asthmaAttacks = Number(event.target.elements.asthmaAttacks.value);
  const smoking = Number(event.target.elements.smoking.value);
  const powder = Number(event.target.elements.powder.value);
  const vape = Number(event.target.elements.vape.value);
  const allElements = Array.from(event.target.elements);

  if (sputum > 0) cough = 2;
  if (daysDisease <= 28) {
    if (runnyNose > 0 && pollinosis === 0)
      mixDiagnoses.push(titleStates.acuteRhinitis);
    if (soreThroat > 0 && plaquesTonsils > 0)
      mixDiagnoses.push(titleStates.acuteTonsillitis);
    if (soreThroat > 0 && plaquesTonsils === 0)
      mixDiagnoses.push(titleStates.acutePharyngitis);
    if (cough === 1) mixDiagnoses.push(titleStates.acuteTracheitis);
    if (cough === 2 && sputum > 0)
      mixDiagnoses.push(titleStates.acuteBronchitis);
    if (cough === 2 && sputum > 0 && dyspnoea > 20)
      mixDiagnoses.push(titleStates.acuteObstructiveBronchitis);
    if (cough === 2 && sputum > 0 && asthmaAttacks > 0)
      mixDiagnoses.push(titleStates.acuteBronchiolitis);
    if (cough === 2 && sputum > 0 && chestPainBreathing > 0)
      mixDiagnoses.push(titleStates.pleuritis);
    if (cough === 2 && sputum > 0 && frequentPneumonia > 0)
      mixDiagnoses.push(titleStates.bronchoectaticLungCondition);
  } else {
    if (runnyNose > 0 && pollinosis === 0)
      mixDiagnoses.push(titleStates.chronicRhinitis);
    if (soreThroat > 0 && plaquesTonsils > 0)
      mixDiagnoses.push(titleStates.chronicTonsillitis);
    if (soreThroat > 0 && plaquesTonsils === 0)
      mixDiagnoses.push(titleStates.chronicPharyngitis);
    if (cough === 1) mixDiagnoses.push(titleStates.cough);
    if (cough === 2 && sputum > 0)
      mixDiagnoses.push(titleStates.chronicBronchitis);
    if (cough === 2 && sputum > 0 && dyspnoea > 20)
      mixDiagnoses.push(titleStates.copd);
    if (cough === 2 && sputum > 0 && asthmaAttacks > 0)
      mixDiagnoses.push(titleStates.copd);
    if (cough === 2 && sputum > 0 && frequentPneumonia > 0)
      mixDiagnoses.push(titleStates.bronchoectaticLungCondition);
  }
  if (bronchialAsthmaAnamnesis + asthmaAttacks === 2)
    mixDiagnoses.push(titleStates.bronchialAsthma);
  if (cough === 2 && sputum > 0 && dyspnoea > 20) {
    if (hemoptysis === 0) mixDiagnoses.push(titleStates.pneumonia);
    if (hemoptysis === 1)
      mixDiagnoses.push(titleStates.pneumoniaWithBloodThroating);
    if (hemoptysis === 2)
      mixDiagnoses.push(
        titleStates.pneumoniaWithBloodThroating,
        titleStates.pulmonaryTuberculosis,
        titleStates.tela,
        titleStates.pulmonaryInfarction
      );
  }
  if (hemoptysis === 1)
    mixDiagnoses.push(titleStates.pneumoniaWithBloodThroating);
  if (hemoptysis === 2)
    mixDiagnoses.push(
      titleStates.pneumoniaWithBloodThroating,
      titleStates.pulmonaryTuberculosis,
      titleStates.tela,
      titleStates.pulmonaryInfarction
    );
  if (runnyNose > 0 && pollinosis > 0)
    mixDiagnoses.push(titleStates.pollinosis);
  if (bronchialAsthmaConfirmed > 0)
    mixDiagnoses.push(titleStates.bronchialAsthma);
  if (
    cough === 2 &&
    sputum > 0 &&
    dyspnoea > 20 &&
    smoking + powder + vape >= 10
  )
    mixDiagnoses.push(titleStates.copd);
  if (powder > 0) otherGuidelines.push(titleStates.respiratoryProtection);
  if (smoking + vape > 0) otherGuidelines.push(titleStates.rejectionBadHabits);
  if (
    soreThroat +
      plaquesTonsils +
      runnyNose +
      pollinosis +
      cough +
      sputum +
      hemoptysis +
      chestPainBreathing +
      bronchialAsthmaAnamnesis +
      bronchialAsthmaConfirmed +
      asthmaAttacks ===
    0
  ) {
    mixDiagnoses.push(titleStates.noPathology);
  }
  let uniqueDiagnoses = new Set(mixDiagnoses);
  personalData.title = Array.from(uniqueDiagnoses);
  personalData.anamnesis = historyTaking(allElements);
  personalData.otherGuidelines = otherGuidelines;
  personalData.nameSurname = formatedSymbolInName(personalData.nameSurname);

  const object = {};
  object.titles = personalData.title;

  // отправка диагнозов на сервер для получения рекомендаций
  postTitlesForListRecomFromDB("/searchDiagnoses", JSON.stringify(object));
  localStorage.setItem("survey", JSON.stringify(personalData));

  // перезагрузка формы
  formFromRespiratoryAnamnesis.reset();
};
