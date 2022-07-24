{
  const WITH_MOCKS = false;
  const WITH_CKEDITOR = false;
  const WITH_FILE_UPLOAD = true;

  /** @enum {string} */
  const OperationState = {
    NONE: `none`,
    PENDING: `pending`,
    OK: `ok`,
    ERROR: `error`,
  };

  const IMAGE_MOCKS = [
    {
      localId: nanoid(),
      remoteId: undefined,
      file: {name: `IMG_21327737.jpg`, size: 12.45 * 1024 * 1024},
      state: `ok`,
      progress: 1,
      xhr: null,
      view: null,
    },
    {
      localId: nanoid(),
      remoteId: undefined,
      file: {name: `IMG_21327737.jpg`, size: 12.45 * 1024 * 1024},
      state: `pending`,
      progress: 0.3,
      xhr: null,
      view: null,
    },
    {
      localId: nanoid(),
      remoteId: undefined,
      file: {name: `IMG_21327737.jpg`, size: 12.45 * 1024 * 1024},
      state: `error`,
      progress: 0.5,
      xhr: null,
      view: null,
    },
  ];

  /** @enum {number} */
  const Viewport = {
    MOBILE: 1150,
  };

  const calculateIsMobile = (width = window.innerWidth) => {
    return width <= Viewport.MOBILE;
  };

  const addViewportListener = (onChange, shouldInit = false) => {
    let isMobile = calculateIsMobile();
    if (shouldInit) {
      onChange(isMobile);
    }
    const onWindowResize = () => {
      const newIsMobile = calculateIsMobile();
      if (newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        onChange(isMobile);
      }
    };
    window.addEventListener(`resize`, onWindowResize);
    return () => {
      window.removeEventListener(`resize`, onWindowResize);
    };
  };

  const MAX_UPLOAD_PROGRESS = 0.8;
  const MAX_DOWNLOAD_PROGRESS = 0.2;
  const MIN_PROGRESS = 0;
  const MAX_PROGRESS = 1;

  const calculateProgress = (currentValue, maxValue, maxProgress) => {
    const progress = currentValue / maxValue * maxProgress;
    return Math.max(MIN_PROGRESS, Math.min(progress, maxProgress));
  };

  const uploadFormData = (url, formKeyValue, callback) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(formKeyValue)) {
      formData.append(key, value);
    }
    let progress = 0;
    callback({state: OperationState.PENDING, progress});

    return $.ajax(url, {
      method: `POST`,
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      xhr() {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener(`progress`, (evt) => {
          if (evt.lengthComputable) {
            progress = calculateProgress(evt.loaded, evt.total, MAX_UPLOAD_PROGRESS);
            callback({state: OperationState.PENDING, progress});
          }
        }, false);

        xhr.addEventListener(`progress`, (evt) => {
          if (evt.lengthComputable) {
            progress = MAX_UPLOAD_PROGRESS + calculateProgress(evt.loaded, evt.total, MAX_DOWNLOAD_PROGRESS);
            callback({state: OperationState.PENDING, progress});
          }
        }, false);

        return xhr;
      },
      success(data) {
        progress = MAX_PROGRESS;
        callback({state: OperationState.OK, progress, data});
      },
      error(data) {
        callback({state: OperationState.ERROR, progress, data});
      },
    });
  };

  const firmFormFileTemplate = document.getElementById(`firm-form-file-template`);

  const mountFirmFormFile = (container, image, {onRemoveClick, onRetryClick}) => {
    const element = firmFormFileTemplate.content.cloneNode(true).querySelector(`.firm-form-file`);
    const fileIdElement = element.querySelector(`[name="imgfile_id"]`);
    const stateElement = element.querySelector(`.firm-form-file__state`);
    const nameElement = element.querySelector(`.firm-form-file__name`);
    const sizeElement = element.querySelector(`.firm-form-file__size`);
    const noneActionElement = element.querySelector(`.firm-form-file__action--none`);
    const removeActionElement = element.querySelector(`.firm-form-file__action--remove`);
    const retryActionElement = element.querySelector(`.firm-form-file__action--retry`);

    const render = () => {
      element.setAttribute(`data-state`, image.state);
      element.style.setProperty(`--progress`, image.progress);

      fileIdElement.value = image.remoteId;

      stateElement.setAttribute(`data-state`, image.state);

      nameElement.textContent = image.file.name;

      sizeElement.textContent = formatSize(image.file.size);

      noneActionElement.classList.toggle(`active`, image.state === OperationState.OK);

      removeActionElement.dataset.localId = image.localId;
      removeActionElement.classList.toggle(`active`, image.state !== OperationState.OK);
      removeActionElement.addEventListener(`click`, onRemoveClick);

      retryActionElement.dataset.localId = image.localId;
      retryActionElement.classList.toggle(`active`, image.state === OperationState.ERROR);
      retryActionElement.addEventListener(`click`, onRetryClick);
    };

    const unmount = () => {
      removeActionElement.removeEventListener(`click`, onRemoveClick);
      retryActionElement.removeEventListener(`click`, onRetryClick);
      element.remove();
    };

    render();
    container.appendChild(element);

    return {
      render,
      unmount,
    };
  };

  const formatNumber = (number, fractionDigits = 0, decimalPoint = `.`, thousandSeparator = `&nbsp;`, defaultValue = `-`) => {
    if (!Number.isFinite(number)) {
      return defaultValue;
    }
    return number
        .toFixed(fractionDigits)
        .replace(/[.,]/g, decimalPoint)
        .replace(/\B(?=(?:\d{3})+(?!\d))/g, thousandSeparator);
  };

  const formatSize = (size, sizeRatio = 1024) => {
    if (!Number.isFinite(size)) {
      return `-`;
    }

    if (size < sizeRatio) {
      return `${formatNumber(size)} байт`;
    }

    size /= sizeRatio;
    if (size < sizeRatio) {
      return `${formatNumber(size)} Kb`;
    }

    size /= sizeRatio;
    if (size < sizeRatio) {
      return `${formatNumber(size, 1)} Mb`;
    }

    size /= sizeRatio;
    return `${formatNumber(size, 1)} Gb`;
  };

  const firmFormContactsTemplate = document.getElementById(`firm-form-contacts-extra-template`);

  const mountFirmFormContacts = (footer, {index}) => {
    const element = firmFormContactsTemplate.content.cloneNode(true).firstElementChild;

    const phoneElement = element.querySelector(`[name="addresses[0][telephone]"]`);
    const addressElement = element.querySelector(`[name="addresses[0][address]"]`);
    const coordsElement = element.querySelector(`[name="addresses[0][coords]"]`);

    phoneElement.name = `addresses[${index}][telephone]`;
    addressElement.name = `addresses[${index}][address]`;
    coordsElement.name = `addresses[${index}][coords]`;

    const mapView = mountFirmFormMap(element);

    footer.before(element);

    phoneElement.focus();
    scrollIntoViewIfNeeded(element);

    return {
      unmount() {
        element.remove();
        mapView.unmount();
      },
    };
  };

  const scrollIntoViewIfNeeded = (element) => {
    if (!element) {
      return false;
    }
    const clientRect = element.getBoundingClientRect();
    if (clientRect.top < 0 || clientRect.bottom >= window.innerHeight) {
      const centerDifference = {
        left: window.innerWidth > clientRect.width ? ((window.innerWidth - clientRect.width) / 2) : 0,
        top: window.innerHeight > clientRect.height ? ((window.innerHeight - clientRect.height) / 2) : 0,
      };
      window.scroll({
        left: window.scrollX + clientRect.left - centerDifference.left,
        top: window.scrollY + clientRect.top - centerDifference.top,
      });
    }
    return true;
  };

  const mountFirmFormMap = (container) => {
    const mapContainer = container.querySelector(`.firm-form-map`);
    const mapInput = mapContainer.parentNode.querySelector(`input`);
    let mapElement;

    ymaps.ready(() => {
      mapElement = renderMap(mapContainer, mapInput);
    });

    return {
      unmount() {
        mapElement.destroy();
      },
    };
  };

  const setAddress = (value, input, placemark) => {
    if (value.length !== 2) {
      input.value = ``;
      placemark.options.set(`visible`, false);
      return;
    }
    input.value = value;
    placemark.geometry.setCoordinates(value);
    placemark.options.set(`visible`, true);
  };

  const DEFAULT_CENTER = [`45.023877`, `38.970157`];

  const renderMap = (container, input, center = DEFAULT_CENTER) => {
    const map = new ymaps.Map(container, {
      center,
      zoom: 14
    });

    map.events.add(`mousedown`, (evt) => {
      setAddress(evt.get(`coords`), input, placemark);
    });

    const placemark = new ymaps.Placemark(map.getCenter(), {}, {
      iconLayout: 'default#image',
      iconImageHref: './map-pin.svg',
      iconImageSize: [64, 64],
      iconImageOffset: [-32, -64]
    });
    placemark.events.add(`mousedown`, (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      setAddress(``, input, placemark);
    });
    map.geoObjects.add(placemark);

    setAddress(center, input, placemark);
    return map;
  };

  const getTransferFiles = (dataTransfer) => {
    if (dataTransfer.items) {
      const files = [];
      for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i];
        if (item.kind === `file`) {
          files.push(dataTransfer.items[i].getAsFile());
        }
      }
      return files;
    }
    const files = [];
    for (let i = 0; i < dataTransfer.files.length; i++) {
      files.push(dataTransfer.files.item(i));
    }
    return files;
  };

  const filesContainer = document.querySelector(`.firm-form__file-list`);
  let imageMap = {};

  if (WITH_MOCKS) {
    for (let image of IMAGE_MOCKS) {
      image.view = mountFirmFormFile(filesContainer, image, {
        onRemoveClick: (evt) => removeFile(evt.currentTarget.dataset.localId),
        onRetryClick: (evt) => retryFile(evt.currentTarget.dataset.localId),
      });
      imageMap[image.localId] = image;
    }
  }

  const isFilesOk = () => {
    return Object.values(imageMap).every((image) => image.remoteId);
  };

  const addFile = (file) => {
    if (!file) {
      return;
    }
    removeAllFiles();
    const localId = nanoid();
    const image = {
      localId,
      remoteId: ``,
      file,
      state: OperationState.PENDING,
      progress: 0,
      xhr: null,
      view: null,
    };
    image.view = mountFirmFormFile(filesContainer, image, {
      onRemoveClick: (evt) => removeFile(evt.currentTarget.dataset.localId),
      onRetryClick: (evt) => retryFile(evt.currentTarget.dataset.localId),
    });
    imageMap[localId] = image;
    retryFile(localId)
  };

  const removeAllFiles = () => {
    Object.values(imageMap).forEach((image) => removeFile(image.localId));
  };

  const removeFile = (localId) => {
    const image = imageMap[localId];
    if (!image) {
      return;
    }
    if (image.xhr) {
      image.xhr.abort();
      image.xhr = null;
    }
    if (image.view) {
      image.view.unmount();
      image.view = null;
    }
    delete imageMap[localId];
  };

  const retryFile = (key) => {
    const image = imageMap[key];
    if (!image) {
      return;
    }
    if (!WITH_FILE_UPLOAD) {
      image.state = OperationState.OK;
      image.progress = 1;
      image.view.render();
      return;
    }
    const form = {
      file: image.file,
      remoteId: WITH_MOCKS ? nanoid() : ``,
    };
    image.xhr = uploadFormData(`https://httpbin.org/post`, form, ({state, progress, data}) => {
      image.state = state;
      image.progress = progress;
      image.remoteId = (data && data.form && data.form.remoteId) || ``;
      if (image.state !== OperationState.PENDING) {
        image.xhr = null;
      }
      image.view.render();
    });
  };

  window.onFilesChange = (evt) => {
    const files = evt.currentTarget.files;
    for (let i = 0; i < files.length; i++) {
      addFile(files.item(i));
    }
    if (WITH_FILE_UPLOAD) {
      evt.currentTarget.value = ``;
    }
  };

  const fileArea = document.querySelector(`.firm-form__file`);

  window.onFilesDragOver = (evt) => {
    evt.preventDefault();

    fileArea.classList.add(`active`);
    evt.dataTransfer.dropEffect = `move`;
  };

  window.onFilesDragLeave = () => {
    fileArea.classList.remove(`active`);
  };

  window.onFilesDragEnd = () => {
    fileArea.classList.remove(`active`);
  };

  window.onFilesDrop = (evt) => {
    evt.preventDefault();

    const file = getTransferFiles(evt.dataTransfer)[0];
    if (!file) {
      return;
    }

    fileArea.classList.remove(`active`);

    addFile(file);

    if (!WITH_FILE_UPLOAD) {
      evt.currentTarget.value = file;
    }
  };

  const contactExtraContainer = document.querySelector(`.firm-form__contacts-extra`);
  const contactExtraFooter = document.querySelector(`.firm-form__field--add-address`);
  const contactExtraViews = [];
  let contactExtraIndex = 0;

  window.onAddAddressClick = () => {
    const view = mountFirmFormContacts(contactExtraFooter, {index: contactExtraIndex++});
    contactExtraViews.push(view);
    contactExtraContainer.classList.add(`active`);
  };

  const h1 = document.querySelector(`.firm-form h1`);

  window.onResetClick = () => {
    removeAllFiles();

    contactExtraContainer.classList.remove(`active`);
    for (const view of contactExtraViews) {
      view.unmount();
    }
    contactExtraViews.length = 0;
    scrollIntoViewIfNeeded(h1);
  };

  mountFirmFormMap(document.querySelector(`.firm-form__contacts--primary`));

  const typeField = document.getElementById(`firm-form-type`);
  addViewportListener((isMobile) => {
    typeField.placeholder = isMobile ? `Указать автоматически` : `Не знаю, укажите сами`;
  }, true);

  const path = `https://makhachkala.dimpoisk.ru/plugins/p_simplecaptcha/jquerysimplecaptcha/`;
  $(`#captcha`).simpleCaptcha({
    scriptPath: path + 'simpleCaptcha.php',
    introText: 'Для безопасности выберите картинку с изображением: <strong class="captchaText"></strong>&nbsp;&nbsp;&nbsp;',
    refreshButton: '<img src="' + path + 'refresh_btn.png" style="top: 0;" class="refreshButton firm-form__captcha-refresh" alt="Обновить"  />'
  });

  if (WITH_CKEDITOR) {
    CKEDITOR.env.isCompatible = true;
    CKEDITOR.replace(`firm-form-description`, {
      customConfig: `//makhachkala.dimpoisk.ru/plugins/p_ckeditor/editor/config/user_.js`,
      skin: `moono`,
      width: `100%`,
      height: `192px`,
      forcePasteAsPlainText: true,
      extraPlugins: `colorbutton,panelbutton`,
      locationMapPath: `//makhachkala.dimpoisk.ru/plugins/p_ckeditor/editor/plugins/locationmap/`,
      enterMode: CKEDITOR.ENTER_BR,
      language: `ru`,
    });
  }
}
