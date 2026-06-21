/* =========================================================
   1️⃣ DOM ELEMENT REFERENCES
========================================================= */

/* ---- Video Grid ---- */
const videoGrid = document.getElementById("videoGrid");
const emptyState = document.getElementById("emptyState");

/* ---- Search System ---- */
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const suggestionsBox = document.getElementById("suggestionsBox");

/* ---- Category Buttons ---- */
const categoryButtons = document.querySelectorAll(".category");

/* ---- Sidebar ---- */
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");
const mainContent = document.querySelector(".main-content");

/* ---- Profile Modal System ---- */
const brandBtn = document.querySelector(".brand-btn");
const modal = document.getElementById("contactModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const contactForm = document.getElementById("contactForm");

/* ---- Netflix Style Profile Panel ---- */
const profileToggle = document.getElementById("profileToggle");
const profilePanel = document.getElementById("profilePanel");
const profileOverlay = document.getElementById("profileOverlay");

/* ---- Hero Section ---- */
const heroSlidesContainer = document.getElementById("heroSlides");
const heroTitle = document.getElementById("heroTitle");
const heroDescription = document.getElementById("heroDescription");
const heroWatch = document.getElementById("heroWatch");
const heroInfo = document.getElementById("heroInfo");

const trendingRow = document.getElementById("trendingRow");


/* =========================================================
   2️⃣ GLOBAL STATE VARIABLES
========================================================= */

let currentCategory = "All";
let currentSearch = "";
let currentHeroIndex = 0;
let videos = [];
let heroVideos = []; // First 5 featured videos


/* =========================================================
   3️⃣ UTILITY FUNCTIONS
========================================================= */

/* ---- Format View Counts ---- */
function formatViews(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num;
}


/* =========================================================
   4️⃣ CATEGORY FROM URL (AUTO FILTER)
========================================================= */

const urlParams = new URLSearchParams(window.location.search);
const categoryFromUrl = urlParams.get("category");
const searchFromUrl = urlParams.get("search");

if (categoryFromUrl) {
  currentCategory = categoryFromUrl;

  document.querySelector(".category.active")?.classList.remove("active");
  document
    .querySelector(`.category[data-category="${categoryFromUrl}"]`)
    ?.classList.add("active");
}


if (searchFromUrl) {
  currentSearch = searchFromUrl;

  if (searchInput) {
    searchInput.value = searchFromUrl;
  }
  
}

/* =========================================================
   5️⃣ VIDEO RENDERING SYSTEM
========================================================= */

function renderVideos() {
  if (!videoGrid) return;

  videoGrid.innerHTML = "";

  const filteredVideos = videos.filter(video => {

    const matchCategory =
      currentCategory === "All" || video.category === currentCategory;

    const matchSearch =
      video.title.toLowerCase().includes(currentSearch.toLowerCase());

    return matchCategory && matchSearch;
  });

  if (filteredVideos.length === 0) {
  videoGrid.innerHTML = "";
  if (emptyState) emptyState.style.display = "block";
  return;
}

if (emptyState) emptyState.style.display = "none";

  filteredVideos.forEach(video => {

    const views = video.views || 0;

    const videoCard = document.createElement("div");
    videoCard.classList.add("video-card");

    videoCard.innerHTML = `
      <img src="${video.thumbnail}" class="thumbnail">
      <h3>${video.title}</h3>
      <p class="views">${formatViews(views)} views</p>
    `;

    videoCard.addEventListener("click", () => {
      window.location.href = `watch.html?id=${video.id}`;
    });

    videoGrid.appendChild(videoCard);
  });
}



// ============================
// TRENDING VIDEOS (HORIZONTAL)
// ============================

function renderTrending() {

  if (!trendingRow) return;

  trendingRow.innerHTML = "";

  // Show first 8 videos as trending
  let trendingVideos = videos.filter(video => video.featured).slice(0, 8);

if (trendingVideos.length === 0) {
  trendingVideos = videos.slice(0, 8);
}

  trendingVideos.forEach(video => {

    const card = document.createElement("div");
    card.classList.add("trending-card");

  card.innerHTML = `
  <img src="${video.thumbnail}" class="thumbnail">

  <div class="trending-info">
    <div class="trending-title">${video.title}</div>
    <div class="trending-views">
      ${formatViews(video.views || 0)} views
    </div>
  </div>
`;

    card.addEventListener("click", () => {
      window.location.href = `watch.html?id=${video.id}`;
    });

    trendingRow.appendChild(card);

  });

}




/* =========================================================
   6️⃣ SEARCH SYSTEM (LIVE SEARCH + BUTTON)
========================================================= */
if (searchInput && searchBtn) {

  // Live search
  searchInput.addEventListener("input", () => {
  currentSearch = searchInput.value.trim();
  renderVideos();
  showSuggestions(currentSearch);
});

  // Button search
  searchBtn.addEventListener("click", async () => {

  const query = searchInput.value.trim();

  if (!query) {
    renderVideos();
    return;
  }

  try {

    const response = await fetch(
      `${API_URL}/search?q=${encodeURIComponent(query)}`
    );

    videos = await response.json();

    renderVideos();

  } catch (error) {
    console.error(error);
  }

});

  // Enter key search
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (!query) return;

      window.location.href = `index.html?search=${encodeURIComponent(query)}`;
    }
  });

}


/* =========================================================
   7️⃣ SEARCH SUGGESTIONS SYSTEM
========================================================= */

function showSuggestions(query) {

  if (!suggestionsBox) return;

  if (!query) {
    hideSuggestions();
    return;
  }

  const matches = videos.filter(video =>
    video.title.toLowerCase().includes(query.toLowerCase())
  );

  if (matches.length === 0) {
    hideSuggestions();
    return;
  }

  suggestionsBox.innerHTML = "";

  matches.slice(0, 6).forEach(video => {

    const item = document.createElement("div");
    item.classList.add("suggestion-item");
    item.textContent = video.title;

    item.addEventListener("click", () => {
  searchInput.value = video.title;
  currentSearch = video.title;
  renderVideos();
  hideSuggestions();
});

    suggestionsBox.appendChild(item);
  });

  suggestionsBox.style.display = "block";
}

function hideSuggestions() {
  if (!suggestionsBox) return;
  suggestionsBox.style.display = "none";
  suggestionsBox.innerHTML = "";
}

/* ---- Close Suggestions on Outside Click ---- */
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    hideSuggestions();
  }
});


/* =========================================================
   8️⃣ CATEGORY FILTER SYSTEM
========================================================= */
categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    document.querySelector(".category.active")?.classList.remove("active");
    button.classList.add("active");

    currentCategory = button.dataset.category;
    renderVideos();
  });
});



/* =========================================================
   9️⃣ SIDEBAR TOGGLE SYSTEM
========================================================= */

if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    mainContent?.classList.toggle("shift");
  });
}


/* =========================================================
   🔟 HEADER SCROLL EFFECT
========================================================= */

window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");

  if (window.scrollY > 50) {
    header.style.background = "#000";
  } else {
    header.style.background =
      "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)";
  }
});


/* =========================================================
   1️⃣1️⃣ MODAL PROFILE SYSTEM (PARTNER FORM)
========================================================= */

if (brandBtn && modal) {
  brandBtn.addEventListener("click", () => {
    modalTitle.textContent = "Partner With TechTube";
    modal.classList.add("active");
  });
}

if (closeModal && modal) {
  closeModal.addEventListener("click", () => {
    modal.classList.remove("active");
  });
}

if (contactForm && modal) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Message sent! We'll get back to you soon.");
    modal.classList.remove("active");
  });
}


/* =========================================================
   1️⃣2️⃣ NETFLIX STYLE PROFILE PANEL SYSTEM
========================================================= */

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
}


/* =========================================================
   1️⃣3️⃣ HERO SLIDESHOW SYSTEM
========================================================= */

function initHeroSlideshow() {
  if (
    !heroSlidesContainer ||
    !heroTitle ||
    !heroDescription ||
    !heroWatch ||
    !heroInfo ||
    heroVideos.length === 0
  ) {
    return;
  }

  heroSlidesContainer.innerHTML = "";

  heroVideos.forEach(video => {
    const slide = document.createElement("div");
    slide.classList.add("hero-slide");
    slide.style.backgroundImage = `url(${video.thumbnail})`;
    heroSlidesContainer.appendChild(slide);
  });

  const slides = document.querySelectorAll(".hero-slide");

  function updateHero(index) {
    slides.forEach(slide => slide.classList.remove("active"));
    slides[index].classList.add("active");

    heroTitle.textContent = heroVideos[index].title;
    heroDescription.textContent = heroVideos[index].description;

    heroWatch.onclick = () => {
      window.location.href = `watch.html?id=${heroVideos[index].id}`;
    };

    heroInfo.onclick = () => {
      alert(heroVideos[index].description);
    };
  }

  function nextHeroSlide() {
    currentHeroIndex = (currentHeroIndex + 1) % heroVideos.length;
    updateHero(currentHeroIndex);
  }

  updateHero(0);
  setInterval(nextHeroSlide, 6000);
}


/* =========================================================
   1️⃣4️⃣ LOAD VIDEOS FROM BACKEND
========================================================= */

async function loadVideosFromBackend() {
  try {
    const response = await fetch("https://techtube-backend.onrender.com/videos");
    videos = await response.json();

    heroVideos = videos.filter(video => video.featured).slice(0, 5);

if (heroVideos.length === 0) {
  heroVideos = videos.slice(0, 5);
}

    renderVideos();
    renderTrending();
    initHeroSlideshow();

  } catch (error) {
    console.error("Failed to load videos:", error);
  }
}

loadVideosFromBackend();