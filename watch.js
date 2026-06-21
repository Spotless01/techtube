let videos = [];
const API_URL = "https://techtube-backend.onrender.com";

/* =====================================================
   1️⃣ URL PARAMS & GLOBAL ELEMENTS
===================================================== */

const params = new URLSearchParams(window.location.search);
const videoId = params.get("id");

const videoPlayer = document.getElementById("videoPlayer");
const videoTitle = document.getElementById("videoTitle");
const videoStats = document.getElementById("videoStats");
const videoDescription = document.getElementById("videoDescription");
const recommendedSection = document.getElementById("recommendedSection");
const nextThumbnail = document.getElementById("nextThumbnail");
const likeBtn = document.getElementById("likeBtn");
const likeCount = document.getElementById("likeCount");
const commentName = document.getElementById("commentName");
const commentText = document.getElementById("commentText");
const commentBtn = document.getElementById("commentBtn");
const commentsList = document.getElementById("commentsList");

/* =====================================================
   🔍 GLOBAL SEARCH (WORKS ON ALL PAGES)
===================================================== */

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

if (searchInput && searchBtn) {

  function handleSearch() {
    const query = searchInput.value.trim();

    if (!query) return;

    // Redirect to homepage with search query
    window.location.href = `index.html?search=${encodeURIComponent(query)}`;
  }

  searchBtn.addEventListener("click", handleSearch);

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
}


/* =====================================================
   2️⃣ VIEW STORAGE UTILITIES
   (LocalStorage + SessionStorage)
===================================================== */

// Format large numbers (1000 → 1K, 1000000 → 1M)
function formatViews(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num;
}

function hasViewedThisSession(id) {
  return sessionStorage.getItem("viewed_" + id);
}

function markAsViewed(id) {
  sessionStorage.setItem("viewed_" + id, "true");
}


async function increaseViewOnce() {
  if (hasViewedThisSession(videoId)) return;

  try {
    const response = await fetch(`${API_URL}/videos/${videoId}/view`, {
      method: "PATCH"
    });

    const data = await response.json();

    markAsViewed(videoId);

    videoStats.textContent =
      `${formatViews(data.views)} views • ${videos.find(v => v.id === videoId)?.date || ""}`;

  } catch (error) {
    console.error("Failed to update views:", error);
  }
}

async function likeVideo() {

  if (!likeBtn || !likeCount) return;

  if (sessionStorage.getItem(`liked_${videoId}`)) {
    return;
  }

  try {

    const response = await fetch(
      `${API_URL}/videos/${videoId}/like`,
      {
        method: "PATCH"
      }
    );

    const data = await response.json();

    likeCount.textContent = data.likes;

    likeBtn.classList.add("liked");

    sessionStorage.setItem(
      `liked_${videoId}`,
      "true"
    );

  } catch (error) {
    console.error("Failed to like video:", error);
  }
}


async function loadComments() {
  if (!commentsList || !videoId) return;

  try {
    const response = await fetch(
      `${API_URL}/videos/${videoId}/comments`
    );

    const comments = await response.json();

    commentsList.innerHTML = "";

    comments.reverse().forEach(comment => {

      const item = document.createElement("div");
      item.className = "comment-item";

      item.innerHTML = `
        <h4>${comment.name}</h4>
        <p>${comment.text}</p>
        <span class="comment-date">${comment.date}</span>
      `;

      commentsList.appendChild(item);
    });

  } catch (error) {
    console.error("Failed to load comments:", error);
  }
}

/* =====================================================
   3️⃣ LOAD SELECTED VIDEO
===================================================== */
function initWatchPage() {
  if (!videoPlayer || !videoTitle || !videoDescription || !videoStats) return;

  if (videoId && videos.length > 0) {

    const selectedVideo = videos.find(video => video.id === videoId);

    if (!selectedVideo) {
      document.body.innerHTML =
        "<h2 style='padding:20px'>Video not found.</h2>";
    } else {

      // Load video source
      const youtubePlayer = document.getElementById("youtubePlayer");

      if (!youtubePlayer) return;

if (selectedVideo.video.includes("youtube.com") || selectedVideo.video.includes("youtu.be")) {
  const videoUrl = new URL(selectedVideo.video);
  const youtubeId = videoUrl.searchParams.get("v");

  videoPlayer.style.display = "none";
  youtubePlayer.style.display = "block";
  youtubePlayer.src = `https://www.youtube.com/embed/${youtubeId}`;
  increaseViewOnce();
} else {
  youtubePlayer.style.display = "none";
  videoPlayer.style.display = "block";
  videoPlayer.src = selectedVideo.video;
  videoPlayer.load();
}

      // Set title + description
      videoTitle.textContent = selectedVideo.title;
      videoDescription.textContent = selectedVideo.description;
      if (likeCount) {
  likeCount.textContent = selectedVideo.likes || 0;
}

      // Load and display MongoDB views
let currentViews = selectedVideo.views || 0;

videoStats.textContent =
  `${formatViews(currentViews)} views • ${selectedVideo.date}`;

// Increase views once per browser session
videoPlayer.addEventListener("play", increaseViewOnce);

      // Initialize features
      loadRecommendedVideos(videoId);
loadComments();
if (likeBtn) {

  if (sessionStorage.getItem(`liked_${videoId}`)) {
    likeBtn.classList.add("liked");
  }

  likeBtn.onclick = likeVideo;
}
setupAutoPlay(selectedVideo);
    }
  }
}



/* =====================================================
   4️⃣ NETFLIX STYLE "UP NEXT" AUTOPLAY
===================================================== */

function setupAutoPlay(selectedVideo) {

  const upNextOverlay = document.getElementById("upNextOverlay");
  const countdownNumber = document.getElementById("countdownNumber");
  const cancelNext = document.getElementById("cancelNext");
  const playNow = document.getElementById("playNow");
  const nextVideoTitle = document.getElementById("nextVideoTitle");

  let countdownInterval;
  let countdownValue = 5;

  videoPlayer.addEventListener("ended", () => {

    const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= videos.length) return;

    const nextVideo = videos[nextIndex];

    nextVideoTitle.textContent = nextVideo.title;
    nextThumbnail.src = nextVideo.thumbnail;

    upNextOverlay.classList.add("active");

    countdownValue = 5;
    countdownNumber.textContent = countdownValue;

    countdownInterval = setInterval(() => {
      countdownValue--;
      countdownNumber.textContent = countdownValue;

      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        window.location.href = `watch.html?id=${nextVideo.id}`;
      }
    }, 1000);

    // Cancel autoplay
    cancelNext.onclick = () => {
      clearInterval(countdownInterval);
      upNextOverlay.classList.remove("active");
    };

    // Play immediately
    playNow.onclick = () => {
      clearInterval(countdownInterval);
      window.location.href = `watch.html?id=${nextVideo.id}`;
    };
  });
}


/* =====================================================
   5️⃣ RECOMMENDED VIDEOS (Netflix Style Row)
===================================================== */

function loadRecommendedVideos(currentId) {
  if (!recommendedSection) return;

  recommendedSection.innerHTML = "";

  videos
    .filter(video => video.id !== currentId)
    .forEach(video => {

      const views = video.views || 0;

      const card = document.createElement("div");
      card.classList.add("recommended-card");

      card.innerHTML = `
        <div class="thumb-container">

          <img src="${video.thumbnail}" class="recommended-thumb">

          <!-- 🎥 Preview Video -->
          <video 
  src="${video.video}" 
  class="preview-video" 
  muted 
  loop 
  playsinline
  preload="metadata">
</video>

          <!-- ⏱️ Duration Badge -->
          ${video.duration ? `<span class="duration-badge">${video.duration}</span>` : ""}

        </div>

        <div class="recommended-info">
          <h4>${video.title}</h4>
          <p>TechTube • ${video.category}</p>
        </div>
      `;

      const preview = card.querySelector(".preview-video");
      

      // Hover preview effect
      let hoverTimeout;

        if (preview) {
  card.addEventListener("mouseenter", () => {
    hoverTimeout = setTimeout(() => {
      preview.currentTime = 5;
      preview.play().catch(() => {});
    }, 500);
  });

  card.addEventListener("mouseleave", () => {
    clearTimeout(hoverTimeout);
    preview.pause();
    preview.currentTime = 0;
  });
}

      card.addEventListener("click", () => {
        window.location.href = `watch.html?id=${video.id}`;
      });

      recommendedSection.appendChild(card);
    });
}


/* =====================================================
   6️⃣ SIDEBAR TOGGLE
===================================================== */

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

if (menuToggle && sidebar && sidebarOverlay) {

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    sidebarOverlay.classList.toggle("active");
  });

  sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
  });
}


/* =====================================================
   7️⃣ WATCH PAGE CATEGORY LINKS
===================================================== */

const watchCategories = document.querySelectorAll(".watch-category");

watchCategories.forEach(item => {
  item.addEventListener("click", () => {

    const category = item.dataset.category;

    // Close sidebar
    if (sidebar && sidebarOverlay) {
      sidebar.classList.remove("active");
      sidebarOverlay.classList.remove("active");
    }

    window.location.href = `index.html?category=${category}`;
  });
});


/* =====================================================
   8️⃣ PROFILE PANEL (Netflix Style)
===================================================== */

const profileToggle = document.getElementById("profileToggle");
const profilePanel = document.getElementById("profilePanel");
const profileOverlay = document.getElementById("profileOverlay");

if (profileToggle && profilePanel && profileOverlay) {

  profileToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    profilePanel.classList.add("active");
    profileOverlay.classList.add("active");
  });

  profileOverlay.addEventListener("click", () => {
    profilePanel.classList.remove("active");
    profileOverlay.classList.remove("active");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      profilePanel.classList.remove("active");
      profileOverlay.classList.remove("active");
    }
  });
}


/* =====================================================
   9️⃣ HEADER SCROLL EFFECT
===================================================== */

window.addEventListener("scroll", () => {

  const header = document.querySelector(".header");
  if (!header) return;

  if (window.scrollY > 50) {
    header.style.background = "#000";
  } else {
    header.style.background =
      "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)";
  }
});


/* =====================================================
   🔟 EXPANDABLE VIDEO DESCRIPTION
===================================================== */

if (videoDescription) {

  let expanded = false;

  videoDescription.addEventListener("click", () => {
    expanded = !expanded;
    videoDescription.style.maxHeight = expanded ? "none" : "80px";
  });
}

async function loadVideosFromBackend() {
  try {
    const response = await fetch(`${API_URL}/videos`);
    videos = await response.json();

    initWatchPage();

  } catch (error) {
    console.error("Failed to load videos:", error);
  }
}

if (commentBtn) {

  commentBtn.addEventListener("click", async () => {

    const name = commentName.value.trim() || "Anonymous";
    const text = commentText.value.trim();

    if (!text) {
      alert("Please enter a comment.");
      return;
    }

    try {

      await fetch(
        `${API_URL}/videos/${videoId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            text
          })
        }
      );

      commentText.value = "";

      loadComments();

    } catch (error) {
      console.error("Failed to post comment:", error);
    }

  });

}

loadVideosFromBackend();