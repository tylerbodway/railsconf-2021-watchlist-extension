const STORAGE = chrome.storage.local;
const STORAGE_KEY = "savedVideos";
const ADD_TEXT = "👀";
const REMOVE_TEXT = "⛔";

// Functions

function getSavedVideos(callback) {
  STORAGE.get(STORAGE_KEY, (storage) => {
    const videos = storage[STORAGE_KEY] || [];
    callback(videos);
  });
}

function setSavedVideos(videos, callback = null) {
  STORAGE.set({ [STORAGE_KEY]: videos }, callback);
}

function handleStorageChange(changes, _namespace) {
  for (let [key, { newValue: savedVideos }] of Object.entries(changes)) {
    if (key !== STORAGE_KEY) return;

    updateWatchlistVideoItems(savedVideos);
  }
}

function toggleVideo(event) {
  const button = event.target;
  const selectedId = button.dataset.rcwlId;

  const updateButtonText = (id, newText) => {
    document.querySelectorAll(`button[data-rcwl-id="${id}"]`).forEach((b) => {
      b.innerText = newText;
    });
  };

  getSavedVideos((videos) => {
    if (videos.some((video) => video.id === selectedId)) {
      updateButtonText(selectedId, ADD_TEXT);
      setSavedVideos(videos.filter((video) => video.id !== selectedId));
    } else {
      updateButtonText(selectedId, REMOVE_TEXT);
      setSavedVideos([
        ...videos,
        {
          id: button.dataset.rcwlId,
          category: button.dataset.rcwlCategory,
          originalMarkup: button.dataset.rcwlMarkup,
        },
      ]);
    }
  });
}

function getDataFromVideoItemNode(node) {
  const href = node.querySelector("a").href;
  const hrefRegex = new RegExp("/watch/([a-z0-9-]*)/([a-z0-9-]*)");
  const whitespaceRegex = new RegExp("/(\r\n|\n|\r)/gm");
  const [_href, category, id] = href.match(hrefRegex);
  const originalMarkup = node.outerHTML.trim().replace(whitespaceRegex, "");

  return { id, category, originalMarkup };
}

function htmlToElement(html) {
  var template = document.createElement("template");
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}

function transformOriginalVideoItem(node, data = {}, isSaved = false) {
  const { id, category, originalMarkup } = data;

  node.classList.add("rcwl-video-list-item");

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("rcwl-button-container");

  const button = document.createElement("button");
  button.classList.add("rcwl-button");
  button.innerText = isSaved ? REMOVE_TEXT : ADD_TEXT;
  button.dataset.rcwlId = id;
  button.dataset.rcwlCategory = category;
  button.dataset.rcwlMarkup = originalMarkup;
  button.addEventListener("click", toggleVideo);

  buttonContainer.append(button);
  node.append(buttonContainer);
}

function updateWatchlistVideoItems(savedVideos) {
  const watchlist = document.querySelector("#rcwl-watchlist ul");
  watchlist.innerHTML = "";
  savedVideos.forEach((videoData) => {
    const listItem = htmlToElement(videoData.originalMarkup);
    listItem.classList.add("playlist");

    transformOriginalVideoItem(listItem, videoData, true);
    watchlist.append(listItem);
  });
}

function getPlaylistVideoItems() {
  return document.querySelectorAll("#playlists .small_video");
}

// End of functions

const headerText = "My Watchlist";
const paragraphText = `Click "${ADD_TEXT}" on playlist videos to add them to your watchlist.`;

const watchlist = document.createElement("div");
watchlist.id = "rcwl-watchlist";
watchlist.innerHTML = `<h2>${headerText}</h2>`;

const description = document.createElement("p");
description.innerText = paragraphText;

const list = document.createElement("ul");
list.classList.add("playlists", "playlist-videos");

watchlist.append(description);
watchlist.append(list);

document.getElementById("playlists-hero").after(watchlist);

getSavedVideos((savedVideos) => {
  updateWatchlistVideoItems(savedVideos);
  getPlaylistVideoItems().forEach((video) => {
    const data = getDataFromVideoItemNode(video);
    const isSaved = savedVideos.some((video) => video.id === data.id);
    transformOriginalVideoItem(video, data, isSaved);
  });
});

chrome.storage.onChanged.addListener(handleStorageChange);
