(function () {
  var songs = [];
  var currentSongIndex = 0;
  var isPlaying = false;
  var audioElement = null;
  var randomMode = false;
  var loopMode = false;
  var capturedHeaders = {};
  var enabled = false;
  var lastVolume = 1;
  var isSeeking = false;

  var nowPlayingLabel = null;
  var sliderEl = null;
  var timeCurrentEl = null;
  var timeDurationEl = null;
  var volumeSliderEl = null;
  var volumeBtn = null;
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
    volumeHigh: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    volumeMute: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>'
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
      ".blt-transport{background:#111;border-radius:22px;padding:6px;display:inline-flex;flex-direction:column;align-items:center;overflow:hidden;transition:max-height .3s ease;max-height:48px;}",
      ".blt-transport.blt-expanded{max-height:180px;}",
      ".blt-controls{display:flex;align-items:center;gap:4px;}",
      ".blt-ctrl{width:32px;height:32px;border-radius:9999px;border:none;background:transparent;color:#888;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s ease,transform .05s ease,color .15s ease;padding:0;}",
      ".blt-ctrl:hover{background:#1E1E1E;color:#ccc;}",
      ".blt-ctrl:active{transform:scale(0.96);}",
      ".blt-ctrl.blt-play{width:36px;height:36px;background:#1E1E1E;color:#E5E5E5;}",
      ".blt-ctrl.blt-play:hover{background:#2A2A2A;}",
      ".blt-ctrl.blt-active{background:#1E1E1E;color:#fff;}",
      ".blt-ctrl.blt-active:hover{background:#2A2A2A;}",
      ".blt-now-playing{font-size:12px;color:#ccc;font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:500;letter-spacing:0.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;padding:4px 10px 0;opacity:0;transition:opacity .25s ease;}",
      ".blt-transport.blt-expanded .blt-now-playing{opacity:1;}",
      ".blt-timer-row{display:flex;align-items:center;gap:6px;width:100%;padding:4px 10px 2px;box-sizing:border-box;opacity:0;transition:opacity .25s ease;}",
      ".blt-transport.blt-expanded .blt-timer-row{opacity:1;}",
      ".blt-time{font-size:10px;color:#666;font-family:'Inter','Segoe UI',system-ui,sans-serif;font-weight:500;font-variant-numeric:tabular-nums;min-width:32px;text-align:center;}",
      ".blt-slider{-webkit-appearance:none;appearance:none;flex:1;height:3px;background:#333;border-radius:2px;outline:none;cursor:pointer;margin:0;}",
      ".blt-slider::-webkit-slider-runnable-track{height:3px;background:transparent;border-radius:2px;}",
      ".blt-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:10px;height:10px;border-radius:50%;background:#fff;cursor:pointer;margin-top:-3.5px;box-shadow:0 0 3px rgba(0,0,0,0.4);}",
      ".blt-slider::-moz-range-track{height:3px;background:#333;border-radius:2px;}",
      ".blt-slider::-moz-range-progress{height:3px;background:#666;border-radius:2px;}",
      ".blt-slider::-moz-range-thumb{width:10px;height:10px;border-radius:50%;background:#fff;cursor:pointer;border:none;box-shadow:0 0 3px rgba(0,0,0,0.4);}",
      ".blt-vol-row{display:flex;align-items:center;gap:6px;width:100%;padding:2px 10px 4px;box-sizing:border-box;opacity:0;transition:opacity .25s ease;}",
      ".blt-transport.blt-expanded .blt-vol-row{opacity:1;}",
      ".blt-vol-btn{background:none;border:none;color:#666;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;width:18px;height:18px;transition:color .15s ease;}",
      ".blt-vol-btn:hover{color:#ccc;}",
      ".blt-vol-slider{-webkit-appearance:none;appearance:none;flex:1;height:3px;background:#333;border-radius:2px;outline:none;cursor:pointer;margin:0;}",
      ".blt-vol-slider::-webkit-slider-runnable-track{height:3px;background:transparent;border-radius:2px;}",
      ".blt-vol-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:8px;height:8px;border-radius:50%;background:#fff;cursor:pointer;margin-top:-2.5px;box-shadow:0 0 2px rgba(0,0,0,0.4);}",
      ".blt-vol-slider::-moz-range-track{height:3px;background:#333;border-radius:2px;}",
      ".blt-vol-slider::-moz-range-progress{height:3px;background:#666;border-radius:2px;}",
      ".blt-vol-slider::-moz-range-thumb{width:8px;height:8px;border-radius:50%;background:#fff;cursor:pointer;border:none;box-shadow:0 0 2px rgba(0,0,0,0.4);}"
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
    sliderEl.style.background = "linear-gradient(to right, #666 0%, #666 " + pct + "%, #333 " + pct + "%, #333 100%)";
  }

  function updateVolumeFill(pct) {
    if (!volumeSliderEl) return;
    volumeSliderEl.style.background = "linear-gradient(to right, #666 0%, #666 " + pct + "%, #333 " + pct + "%, #333 100%)";
  }

  function updateVolumeIcon() {
    if (!volumeBtn) return;
    volumeBtn.innerHTML = (audioElement && audioElement.volume === 0) ? ICONS.volumeMute : ICONS.volumeHigh;
  }

  function updatePlayPauseIcon() {
    if (!playPauseBtn) return;
    playPauseBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
  }

  function updateNowPlaying(song) {
    if (!nowPlayingLabel) return;
    var capsule = nowPlayingLabel.parentElement;
    if (song) {
      nowPlayingLabel.textContent = currentSongIndex + "/" + songs.length + "  " + song.name;
      if (capsule) capsule.classList.add("blt-expanded");
    } else {
      nowPlayingLabel.textContent = "";
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
      if (!isPlaying || songs.length === 0) return;
      currentSongIndex = Math.max(0, currentSongIndex - 2);
      playNextSong();
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

    nowPlayingLabel = document.createElement("span");
    nowPlayingLabel.id = "bandlab-tools-now-playing";
    nowPlayingLabel.className = "blt-now-playing";

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

    var volRow = document.createElement("div");
    volRow.className = "blt-vol-row";

    volumeBtn = document.createElement("button");
    volumeBtn.className = "blt-vol-btn";
    volumeBtn.innerHTML = ICONS.volumeHigh;
    volumeBtn.title = "Mute";
    volumeBtn.onclick = function () {
      if (!audioElement) return;
      if (audioElement.volume > 0) {
        lastVolume = audioElement.volume;
        audioElement.volume = 0;
        volumeSliderEl.value = 0;
        updateVolumeFill(0);
      } else {
        audioElement.volume = lastVolume;
        volumeSliderEl.value = lastVolume * 100;
        updateVolumeFill(lastVolume * 100);
      }
      updateVolumeIcon();
    };

    volumeSliderEl = document.createElement("input");
    volumeSliderEl.type = "range";
    volumeSliderEl.className = "blt-vol-slider";
    volumeSliderEl.min = "0";
    volumeSliderEl.max = "100";
    volumeSliderEl.value = "100";
    volumeSliderEl.step = "1";
    updateVolumeFill(100);

    volumeSliderEl.addEventListener("input", function () {
      var vol = parseFloat(volumeSliderEl.value) / 100;
      if (audioElement) audioElement.volume = vol;
      updateVolumeFill(parseFloat(volumeSliderEl.value));
      updateVolumeIcon();
    });

    volRow.appendChild(volumeBtn);
    volRow.appendChild(volumeSliderEl);

    capsule.appendChild(controlsRow);
    capsule.appendChild(nowPlayingLabel);
    capsule.appendChild(timerRow);
    capsule.appendChild(volRow);
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

  async function playNextSong() {
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

    var songIndex = currentSongIndex;
    if (randomMode) songIndex = Math.floor(Math.random() * songs.length);

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
      audioElement.volume = volumeSliderEl ? parseFloat(volumeSliderEl.value) / 100 : 1;

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