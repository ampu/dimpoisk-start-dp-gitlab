/// viewport-helpers.js
/** @enum {number} */
const Viewport = {
  MOBILE: 1150,
};

const calculateIsMobile = () => {
  return window.innerWidth <= Viewport.MOBILE;
};

const escapeHTML = (html) => {
  return html
      .replace(/ /g, `&nbsp;`)
      .replace(/</g, `&lt;`);
};

/// header.js
const headerSelectCityButton = document.querySelector(`.header__site-nav-item--select`);

headerSelectCityButton.addEventListener(`click`, () => {
  activateSelectCity();
});

/// select-city.js
const cityModal = document.querySelector(`.select-city`);
const cityOverlay = cityModal.querySelector(`.select-city__overlay`);
const cityClose = cityModal.querySelector(`.select-city__close`);
const cityInput = document.querySelector(`.select-city__input input`);
const cityList = document.querySelector(`.select-city__items`);
const cityEmpty = document.querySelector(`.select-city__empty`);

let isSelectCityActive = false;
let selectedCityTitle = ``;
let allCities = [];
let allCitiesNodes = [];

const fetchCities = async () => {
  return [
    {title: `Астрахань`},
    {title: `Армавир`},
    {title: `Азов`},
    {title: `Ростов-на-Дону`, children: [`Баксан`, `Аксай`, `Рассвет`]},
    {title: `Анапа`},
    {title: `Архыз`},
    {title: `Балаково`},
  ];
};

const onCityDocumentKeyDown = (evt) => {
  if (evt.key === `Escape`) {
    deactivateSelectCity();
  }
};

const setSelectedCityTitle = (title) => {
  selectedCityTitle = title;
  cityInput.value = title;
  updateActiveCities();
};

const updateActiveCities = () => {
  const activeCities = selectedCityTitle
      ? allCities.filter((city) => city.title.toLowerCase().includes(selectedCityTitle.toLowerCase()))
      : allCities;

  cityEmpty.classList.toggle(`active`, activeCities.length === 0);

  for (const cityNode of allCitiesNodes) {
    const svg = cityNode.querySelector(`svg`);

    const cityTitle = cityNode.dataset.title;
    const isActive = cityTitle.toLowerCase() === selectedCityTitle.toLowerCase();
    const isHidden = !activeCities.some((city) => city.title === cityTitle);

    svg.classList.toggle(`active`, isActive);
    cityNode.classList.toggle(`active`, isActive);
    cityNode.classList.toggle(`hidden`, isHidden);
  }
};

const onCityClick = (evt) => {
  setSelectedCityTitle(evt.currentTarget.parentNode.dataset.title);
};

const renderCityElement = ({title, children}) => {
  const li = document.createElement(`li`);
  li.dataset.title = title;
  li.innerHTML = `
        <button type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="select-city__check">
                <path d="M13.3333 4L5.99996 11.3333L2.66663 8" stroke="#F2394D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <span class="select-city__city-title">${escapeHTML(title)}</span>
            ${children ? `<span class="select-city__city-children">${escapeHTML(children.join(`, `))}</span>` : ``}
        </button>`;

  const button = li.querySelector(`button`);
  button.addEventListener(`click`, onCityClick);
  return li;
};

const activateSelectCity = () => {
  isSelectCityActive = true;
  cityModal.classList.add(`active`);
  document.body.classList.add(`modal-owner`);
  document.addEventListener(`keydown`, onCityDocumentKeyDown);
};

const deactivateSelectCity = () => {
  isSelectCityActive = false;
  cityModal.classList.remove(`active`);
  document.body.classList.remove(`modal-owner`);
  document.removeEventListener(`keydown`, onCityDocumentKeyDown);
};

const activateSelectCityWithCityTitle = (cityTitle) => {
  activateSelectCity();
  setSelectedCityTitle(cityTitle)
};

cityInput.addEventListener(`input`, () => {
  setSelectedCityTitle(cityInput.value);
});

cityOverlay.addEventListener(`click`, () => {
  deactivateSelectCity();
});

cityClose.addEventListener(`click`, () => {
  deactivateSelectCity();
});

fetchCities().then((cities) => {
  allCities = cities;
  allCitiesNodes = allCities.map(renderCityElement);
  cityList.append(...allCitiesNodes);
  updateActiveCities();
});

/// hero.js

const heroForm = document.querySelector(`.hero__search-form`);
const heroInput = heroForm.querySelector(`input`);
const heroSearchTitle = document.querySelector(`.hero__search-title`);
const heroProfileTitle = document.querySelector(`.hero__profile-title`);
const heroMovieTitle = document.querySelector(`.hero__movie-title`);
const heroDiscountTitle = document.querySelector(`.hero__discount-title`);

heroForm.addEventListener(`submit`, (evt) => {
  evt.preventDefault();
  activateSelectCityWithCityTitle(heroInput.value);
});

const updateHeroTitles = () => {
  const isMobile = calculateIsMobile();
  heroSearchTitle.textContent = isMobile ? `Фирмы и организации города` : `Фирмы и организации вашего города`;
  heroProfileTitle.textContent = isMobile ? `Актуальные новости и события` : `Актуальные новости и события`;
  heroMovieTitle.textContent = isMobile ? `Афиша мероприятий города` : `Афиша кинотеатров, театров, концертов`;
  heroDiscountTitle.textContent = isMobile ? `Выгодные предложения и скидки` : `Выгодные предложения и скидки`;
};

updateHeroTitles();

window.addEventListener(`resize`, () => {
  updateHeroTitles();
});

/// actions.js

const cityActions = document.querySelectorAll(`.actions__select-city`);
const appLinks = document.querySelectorAll(`.actions__apps a`);
const chartLink = document.querySelector(`.actions__chart-link`);

const updateActionTitles = () => {
  const isMobile = calculateIsMobile();

  const appLinkHref = isMobile
      ? `https://makhachkala.m.dimpoisk.ru/skachat-prilozhenie.html`
      : `https://makhachkala.dimpoisk.ru/skachat-prilozhenie.html`;

  appLinks.forEach((appLink) => {
    appLink.href = appLinkHref;
  });

  const chartLinkHref = isMobile
      ? `https://krasnodar.m.dimpoisk.ru/catalog/1000/add.html`
      : `https://krasnodar.dimpoisk.ru/catalog/1000/add.html`;

  chartLink.href = chartLinkHref;
};

updateActionTitles();

window.addEventListener(`resize`, () => {
  updateActionTitles();
});

cityActions.forEach((cityAction) => {
  cityAction.addEventListener(`click`, (evt) => {
    evt.preventDefault();
    activateSelectCity();
  });
});

/// footer.js

const footerSections = document.querySelectorAll(`.footer__site-nav section`);

const forEachFooterSection = (callback) => {
  footerSections.forEach((footerSection) => {
    const footerToggle = footerSection.querySelector(`.footer-toggle`);
    callback(footerSection.dataset.section, footerSection, footerToggle);
  });
};

const toggleFooterSection = (sectionKey, force) => {
  forEachFooterSection((key, section, toggle) => {
    section.classList.toggle(`active`, force && sectionKey === key);
  });
};

forEachFooterSection((key, section, toggle) => {
  toggle.addEventListener(`click`, () => {
    toggleFooterSection(key, !section.classList.contains(`active`));
  });
});
