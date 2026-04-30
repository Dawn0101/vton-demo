const form = document.querySelector("#tryon-form");
const submitButton = document.querySelector("#submit-button");
const statusEl = document.querySelector("#status");
const resultImage = document.querySelector("#result-image");
const thumbButtons = document.querySelectorAll(".thumb");
const config = window.CATVTON_CONFIG || {};
const apiBaseUrl = (config.API_BASE_URL || "").replace(/\/$/, "");

let currentImages = {};

function apiUrl(path) {
  return `${apiBaseUrl}${path}`;
}

function assetUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  return apiUrl(url.startsWith("/") ? url : `/${url}`);
}

function preview(inputId, imageId) {
  const input = document.querySelector(inputId);
  const image = document.querySelector(imageId);
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) {
      image.removeAttribute("src");
      return;
    }
    image.src = URL.createObjectURL(file);
  });
}

preview("#person-input", "#person-preview");
preview("#cloth-input", "#cloth-preview");

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

function selectImage(name) {
  if (!currentImages[name]) return;
  resultImage.src = currentImages[name];
  thumbButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.image === name);
  });
}

thumbButtons.forEach((button) => {
  button.addEventListener("click", () => selectImage(button.dataset.image));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  setStatus("Running");

  try {
    const formData = new FormData(form);

    const response = await fetch(apiUrl("/api/try-on"), {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Request failed");
    }

    currentImages = Object.fromEntries(
      Object.entries(payload.images).map(([name, url]) => [name, assetUrl(url)])
    );
    selectImage("result");
    setStatus("Done");
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});
