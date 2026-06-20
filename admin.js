const loginScreen = document.getElementById("loginScreen");
const adminDashboard = document.getElementById("adminDashboard");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let editingVideoId = null;

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "techtube123";

if (localStorage.getItem("techtubeAdminLoggedIn") === "true") {
  loginScreen.style.display = "none";
  adminDashboard.style.display = "block";
}

loginBtn.addEventListener("click", () => {
  const username = document.getElementById("adminUsername").value;
  const password = document.getElementById("adminPassword").value;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem("techtubeAdminLoggedIn", "true");
    loginScreen.style.display = "none";
    adminDashboard.style.display = "block";
  } else {
    loginError.textContent = "Invalid username or password";
  }
});

const API_URL = "https://techtube-backend.onrender.com";

const form = document.getElementById("videoForm");
const videoList = document.getElementById("videoList");

// ==========================
// LOAD ALL VIDEOS
// ==========================
async function loadVideos() {
  try {
    const response = await fetch(`${API_URL}/videos`);
    const videos = await response.json();

    videoList.innerHTML = "";

    videos.forEach(video => {
      const item = document.createElement("div");
      item.className = "video-item";

      item.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}">

        <div class="video-info">
          <h3>${video.title}</h3>
          <p>${video.category}</p>
          <p>${video.duration}</p>
        </div>

        <button
  class="edit-btn"
  onclick="editVideo('${video.id}')">
  Edit
</button>

        <button
          class="delete-btn"
          onclick="deleteVideo('${video.id}')">
          Delete
        </button>
      `;

      videoList.appendChild(item);
    });

  } catch (error) {
    console.error(error);
  }
}


async function editVideo(id) {
  const response = await fetch(`${API_URL}/videos`);
  const videos = await response.json();

  const video = videos.find(video => video.id === id);

  if (!video) {
    alert("Video not found");
    return;
  }

  editingVideoId = id;

  document.getElementById("title").value = video.title;
  document.getElementById("category").value = video.category;
  document.getElementById("duration").value = video.duration;
  document.getElementById("thumbnail").value = video.thumbnail;
  document.getElementById("video").value = video.video;
  document.getElementById("description").value = video.description;

  submitBtn.textContent = "Update Video";
  cancelEditBtn.style.display = "block";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ==========================
// ADD VIDEO
// ==========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let videoUrl = document.getElementById("video").value;
  const videoFile = document.getElementById("videoFile")?.files[0];

  if (videoFile) {
    const formData = new FormData();
    formData.append("videoFile", videoFile);

    const uploadResponse = await fetch(`${API_URL}/upload-video`, {
      method: "POST",
      body: formData
    });

    const uploadData = await uploadResponse.json();
    videoUrl = uploadData.videoUrl;
  }

  const videoData = {
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    duration: document.getElementById("duration").value,
    thumbnail: document.getElementById("thumbnail").value,
    video: videoUrl,
    description: document.getElementById("description").value
  };

  if (editingVideoId) {
    await fetch(`${API_URL}/videos/${editingVideoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(videoData)
    });

    alert("Video updated successfully!");
  } else {
    await fetch(`${API_URL}/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(videoData)
    });

    alert("Video uploaded successfully!");
  }

  form.reset();
  editingVideoId = null;
  submitBtn.textContent = "Upload Video";
  cancelEditBtn.style.display = "none";

  loadVideos();
});

// ==========================
// DELETE VIDEO
// ==========================
async function deleteVideo(id) {

  if (!confirm("Delete this video?")) return;

  try {
    await fetch(`${API_URL}/videos/${id}`, {
      method: "DELETE"
    });

    loadVideos();

  } catch (error) {
    console.error(error);
  }
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    editingVideoId = null;
    form.reset();
    submitBtn.textContent = "Upload Video";
    cancelEditBtn.style.display = "none";
  });
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("techtubeAdminLoggedIn");
    location.reload();
  });
}

// ==========================
// INITIAL LOAD
// ==========================
loadVideos();