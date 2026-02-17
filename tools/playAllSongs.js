(function () {
  var songs = [];
  var currentSongIndex = 0;
  var isPlaying = false;
  var audioElement = null;
  var randomMode = false;
  var loopMode = false;
  var capturedHeaders = {};
  var enabled = false;
  var isSeeking = false;
  var currentSong = null;
  var songHistory = [];

  var nowPlayingLabel = null;
  var sliderEl = null;
  var timeCurrentEl = null;
  var timeDurationEl = null;
  var shuffleBtn = null;
  var backBtn = null;
  var playPauseBtn = null;
  var forwardBtn = null;
  var loopBtn = null;

  var ICONS = {
    shuffle: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    forward: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
    loop: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>',

  };

  function checkEnabled() {
    if (window.BANDLAB_TOOLS_SETTINGS && window.BANDLAB_TOOLS_SETTINGS.playAllSongs !== false) {
      enabled = true;
    }
  }

  checkEnabled();

  window.addEventListener("message", function (event) {
    if (event.data.type === "BANDLAB_TOOLS_SETTINGS") {
      window.BANDLAB_TOOLS_SETTINGS = event.data.settings;
      var wasEnabled = enabled;
      enabled = event.data.settings.playAllSongs !== false;
      if (enabled && !wasEnabled) displayTransport(0);
    }
  });

  function injectStyles() {
    if (document.getElementById("bandlab-tools-transport-style")) return;
    var style = document.createElement("style");
    style.id = "bandlab-tools-transport-style";
    style.textContent = [
      ".blt-transport{background:rgba(255,255,255,0.06);backdrop-filter:blur(24px) saturate(1.8);-webkit-backdrop-filter:blur(24px) saturate(1.8);border-radius:22px;padding:6px;display:inline-flex;flex-direction:column;align-items:center;overflow:hidden;transition:max-height .3s cubic-bezier(0.4,0,0.2,1),box-shadow .25s ease;max-height:48px;border:1px solid rgba(255,255,255,0.10);box-shadow:0 8px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.08);}",
      ".blt-transport,.blt-transport *{box-sizing:border-box;}",
      ".blt-transport.blt-expanded{max-height:180px;}",
      ".blt-controls{display:flex;align-items:center;justify-content:space-evenly;}",
      ".blt-ctrl{width:32px;height:32px;border-radius:9999px;border:none;background:transparent;color:rgba(255,255,255,0.45);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s cubic-bezier(0.4,0,0.2,1),transform .08s ease,color .2s ease,box-shadow .2s ease;padding:0;}",
      ".blt-ctrl:hover{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.8);box-shadow:0 0 12px rgba(255,255,255,0.04);}",
      ".blt-ctrl:active{transform:scale(0.95);}",
      ".blt-ctrl.blt-play{width:36px;height:36px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.85);border:1px solid rgba(255,255,255,0.08);box-sizing:border-box;box-shadow:inset 0 1px 0 rgba(255,255,255,0.06);}",
      ".blt-ctrl.blt-play:hover{background:rgba(255,255,255,0.12);box-shadow:inset 0 1px 0 rgba(255,255,255,0.08),0 0 16px rgba(255,255,255,0.05);}",
      ".blt-ctrl.blt-active{background:rgba(255,255,255,0.10);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.08);}",
      ".blt-ctrl.blt-active:hover{background:rgba(255,255,255,0.14);}",
      ".blt-now-playing{font-size:12px;color:rgba(255,255,255,0.65);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',system-ui,sans-serif;font-weight:500;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;padding:4px 10px 0;opacity:0;transition:opacity .25s ease,text-shadow .2s ease,color .2s ease;text-decoration:none;cursor:pointer;}",
      ".blt-now-playing:hover{text-shadow:0 0 10px rgba(255,255,255,0.35);color:rgba(255,255,255,0.95);}",
      ".blt-transport.blt-expanded .blt-now-playing{opacity:1;}",
      ".blt-timer-row{display:flex;align-items:center;gap:8px;width:100%;padding:15px 10px 2px;box-sizing:border-box;opacity:0;transition:opacity .25s ease;}",
      ".blt-transport.blt-expanded .blt-timer-row{opacity:1;}",
      ".blt-time{font-size:10px;color:rgba(255,255,255,0.3);font-family:-apple-system,BlinkMacSystemFont,'SF Mono',system-ui,sans-serif;font-weight:500;font-variant-numeric:tabular-nums;min-width:32px;text-align:center;}",
      ".blt-slider{-webkit-appearance:none;appearance:none;flex:1;height:3px;background:rgba(255,255,255,0.10);border-radius:2px;outline:none;cursor:pointer;margin:0;}",
      ".blt-slider::-webkit-slider-runnable-track{height:3px;background:transparent;border-radius:2px;}",
      ".blt-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:10px;height:10px;border-radius:50%;background:linear-gradient(180deg,#fff 0%,#e8e8e8 100%);cursor:pointer;margin-top:-3.5px;box-shadow:0 1px 4px rgba(0,0,0,0.4),0 0 1px rgba(0,0,0,0.2);}",
      ".blt-slider::-moz-range-track{height:3px;background:rgba(255,255,255,0.10);border-radius:2px;}",
      ".blt-slider::-moz-range-progress{height:3px;background:rgba(255,255,255,0.25);border-radius:2px;}",
      ".blt-slider::-moz-range-thumb{width:10px;height:10px;border-radius:50%;background:linear-gradient(180deg,#fff 0%,#e8e8e8 100%);cursor:pointer;border:none;box-shadow:0 1px 4px rgba(0,0,0,0.4),0 0 1px rgba(0,0,0,0.2);}",

    ].join("\n");
    document.head.appendChild(style);
  }

  function makeButton(className, iconHtml, title) {
    var btn = document.createElement("button");
    btn.className = "blt-ctrl" + (className ? " " + className : "");
    btn.innerHTML = iconHtml;
    btn.title = title || "";
    return btn;
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updateSliderFill(pct) {
    if (!sliderEl) return;
    sliderEl.style.background = "linear-gradient(to right, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.25) " + pct + "%, rgba(255,255,255,0.10) " + pct + "%, rgba(255,255,255,0.10) 100%)";
  }

  function updatePlayPauseIcon() {
    if (!playPauseBtn) return;
    playPauseBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
  }

  function updateNowPlaying(song) {
    if (!nowPlayingLabel) return;
    var capsule = nowPlayingLabel.parentElement;
    if (song) {
      currentSong = song;
      nowPlayingLabel.textContent = song.name;
      nowPlayingLabel.href = "https://www.bandlab.com/songs/" + song.id;
      nowPlayingLabel.title = "Open project";
      if (capsule) capsule.classList.add("blt-expanded");
    } else {
      currentSong = null;
      nowPlayingLabel.textContent = "";
      nowPlayingLabel.removeAttribute("href");
      if (capsule) capsule.classList.remove("blt-expanded");
      if (sliderEl) { sliderEl.value = 0; updateSliderFill(0); }
      if (timeCurrentEl) timeCurrentEl.textContent = "0:00";
      if (timeDurationEl) timeDurationEl.textContent = "0:00";
    }
  }

  function displayTransport(retryCount) {
    retryCount = retryCount || 0;
    if (!window.location.pathname.includes("/library/projects/recent")) return;
    if (document.getElementById("bandlab-tools-play-all-container")) return;

    var projectCountEl = document.getElementById("bandlab-tools-project-count");
    if (!projectCountEl) {
      if (retryCount < 20) setTimeout(function () { displayTransport(retryCount + 1); }, 500);
      return;
    }

    injectStyles();

    var wrapper = document.createElement("div");
    wrapper.id = "bandlab-tools-play-all-container";
    wrapper.style.cssText = "padding:10px 20px;display:flex;justify-content:center;";

    var capsule = document.createElement("div");
    capsule.className = "blt-transport";

    var controlsRow = document.createElement("div");
    controlsRow.className = "blt-controls";

    shuffleBtn = makeButton("", ICONS.shuffle, "Shuffle");
    shuffleBtn.onclick = function () {
      randomMode = !randomMode;
      shuffleBtn.classList.toggle("blt-active", randomMode);
    };

    backBtn = makeButton("", ICONS.back, "Previous");
    backBtn.onclick = function () {
      if (!isPlaying || songs.length === 0 || songHistory.length === 0) return;
      var prevSong = songHistory.pop();
      var idx = songs.indexOf(prevSong);
      if (idx !== -1) {
        currentSongIndex = idx;
        playNextSong(true);
      }
    };

    playPauseBtn = makeButton("blt-play", ICONS.play, "Play");
    playPauseBtn.onclick = function () {
      if (songs.length === 0) return;
      if (isPlaying) {
        if (audioElement && !audioElement.paused) {
          audioElement.pause();
          isPlaying = false;
          updatePlayPauseIcon();
        } else {
          stopPlayingAll();
          updatePlayPauseIcon();
          updateNowPlaying(null);
        }
      } else {
        if (audioElement && audioElement.src && audioElement.paused && audioElement.currentTime > 0) {
          audioElement.play();
          isPlaying = true;
          updatePlayPauseIcon();
        } else {
          startPlayingAll();
        }
      }
    };

    forwardBtn = makeButton("", ICONS.forward, "Next");
    forwardBtn.onclick = function () {
      if (!isPlaying || songs.length === 0) return;
      playNextSong();
    };

    loopBtn = makeButton("", ICONS.loop, "Loop");
    loopBtn.onclick = function () {
      loopMode = !loopMode;
      loopBtn.classList.toggle("blt-active", loopMode);
    };

    controlsRow.appendChild(shuffleBtn);
    controlsRow.appendChild(backBtn);
    controlsRow.appendChild(playPauseBtn);
    controlsRow.appendChild(forwardBtn);
    controlsRow.appendChild(loopBtn);

    nowPlayingLabel = document.createElement("a");
    nowPlayingLabel.id = "bandlab-tools-now-playing";
    nowPlayingLabel.className = "blt-now-playing";
    nowPlayingLabel.target = "_blank";

    var timerRow = document.createElement("div");
    timerRow.className = "blt-timer-row";

    timeCurrentEl = document.createElement("span");
    timeCurrentEl.className = "blt-time";
    timeCurrentEl.textContent = "0:00";

    sliderEl = document.createElement("input");
    sliderEl.type = "range";
    sliderEl.className = "blt-slider";
    sliderEl.min = "0";
    sliderEl.max = "100";
    sliderEl.value = "0";
    sliderEl.step = "0.1";

    sliderEl.addEventListener("mousedown", function () { isSeeking = true; });
    sliderEl.addEventListener("touchstart", function () { isSeeking = true; });
    sliderEl.addEventListener("input", function () {
      updateSliderFill(parseFloat(sliderEl.value));
      if (audioElement && audioElement.duration) {
        timeCurrentEl.textContent = formatTime((sliderEl.value / 100) * audioElement.duration);
      }
    });
    sliderEl.addEventListener("change", function () {
      isSeeking = false;
      if (audioElement && audioElement.duration) {
        audioElement.currentTime = (sliderEl.value / 100) * audioElement.duration;
      }
    });
    sliderEl.addEventListener("mouseup", function () { isSeeking = false; });
    sliderEl.addEventListener("touchend", function () { isSeeking = false; });

    timeDurationEl = document.createElement("span");
    timeDurationEl.className = "blt-time";
    timeDurationEl.textContent = "0:00";

    timerRow.appendChild(timeCurrentEl);
    timerRow.appendChild(sliderEl);
    timerRow.appendChild(timeDurationEl);

    capsule.appendChild(controlsRow);
    capsule.appendChild(nowPlayingLabel);
    capsule.appendChild(timerRow);
    wrapper.appendChild(capsule);

    if (projectCountEl.nextSibling) {
      projectCountEl.parentNode.insertBefore(wrapper, projectCountEl.nextSibling);
    } else {
      projectCountEl.parentNode.appendChild(wrapper);
    }
  }

  window.addEventListener("message", function (event) {
    if (event.data.type === "BANDLAB_TOOLS_SONGS_DATA") {
      songs = event.data.songs || [];
      capturedHeaders = event.data.headers || {};
      if (enabled) displayTransport(0);
    } else if (event.data.type === "BANDLAB_TOOLS_PLAY_ALL") {
      if (!enabled) return;
      randomMode = event.data.randomMode || false;
      startPlayingAll();
    } else if (event.data.type === "BANDLAB_TOOLS_STOP_ALL") {
      stopPlayingAll();
    }
  });

  async function getAudioUrlForSong(songId) {
    try {
      var postsUrl = "https://www.bandlab.com/api/v1.3/songs/" + songId + "/posts?limit=50";
      var response = await fetch(postsUrl, { credentials: "include", headers: capturedHeaders });
      if (!response.ok) return null;

      var json = await response.json();
      if (!json.data || !Array.isArray(json.data) || json.data.length === 0) return null;

      var newest = null;
      var newestDate = null;
      for (var i = 0; i < json.data.length; i++) {
        var post = json.data[i];
        if (post.createdOn) {
          var d = new Date(post.createdOn);
          if (!newestDate || d > newestDate) {
            newestDate = d;
            newest = post;
          }
        }
      }

      if (!newest) return null;

      if (newest.revision && newest.revision.mixdown && newest.revision.mixdown.file) {
        return newest.revision.mixdown.file;
      }

      if (newest.revision && newest.revision.mixdown && newest.revision.mixdown.id) {
        var mixId = newest.revision.mixdown.id;
        return "https://static.bandlab.com/revisions-formatted/" + mixId + "/" + mixId + ".m4a";
      }

      return "https://static.bandlab.com/revisions-formatted/" + newest.id + "/" + newest.id + ".m4a";
    } catch (error) {
      return null;
    }
  }

  async function playNextSong(isBack) {
    if (songs.length === 0) {
      stopPlayingAll();
      updatePlayPauseIcon();
      updateNowPlaying(null);
      return;
    }

    if (currentSongIndex >= songs.length) {
      if (loopMode) {
        currentSongIndex = 0;
      } else {
        stopPlayingAll();
        updatePlayPauseIcon();
        updateNowPlaying(null);
        return;
      }
    }

    if (!isBack && currentSong) {
      songHistory.push(currentSong);
      if (songHistory.length > 10) songHistory.shift();
    }

    var songIndex = currentSongIndex;
    if (randomMode && !isBack) songIndex = Math.floor(Math.random() * songs.length);

    var song = songs[songIndex];
    currentSongIndex++;
    updateNowPlaying(song);

    var audioUrl = await getAudioUrlForSong(song.id);
    if (!audioUrl) {
      setTimeout(playNextSong, 1000);
      return;
    }

    if (!audioElement) {
      audioElement = new Audio();

      audioElement.addEventListener("ended", playNextSong);
      audioElement.addEventListener("error", function () { playNextSong(); });

      audioElement.addEventListener("timeupdate", function () {
        if (!isSeeking && audioElement.duration) {
          var pct = (audioElement.currentTime / audioElement.duration) * 100;
          if (sliderEl) sliderEl.value = pct;
          updateSliderFill(pct);
          if (timeCurrentEl) timeCurrentEl.textContent = formatTime(audioElement.currentTime);
        }
      });

      audioElement.addEventListener("loadedmetadata", function () {
        if (timeDurationEl) timeDurationEl.textContent = formatTime(audioElement.duration);
        if (sliderEl) { sliderEl.value = 0; updateSliderFill(0); }
        if (timeCurrentEl) timeCurrentEl.textContent = "0:00";
      });
    }

    audioElement.src = audioUrl;
    audioElement.play().catch(function () { playNextSong(); });
  }

  function startPlayingAll() {
    if (songs.length === 0) return;
    isPlaying = true;
    currentSongIndex = 0;
    songHistory = [];
    updatePlayPauseIcon();
    playNextSong();
  }

  function stopPlayingAll() {
    isPlaying = false;
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    updatePlayPauseIcon();
    updateNowPlaying(null);
  }

  window.BandLabToolsPlayAll = {
    start: startPlayingAll,
    stop: stopPlayingAll,
    setRandomMode: function (mode) { randomMode = mode; },
    setLoopMode: function (mode) { loopMode = mode; },
    setSongs: function (newSongs) { songs = newSongs; }
  };
})();