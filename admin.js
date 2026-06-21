const API_URL = "https://techtube-backend.onrender.com";

// ==========================
// ELEMENTS
// ==========================
const loginScreen = document.getElementById("loginScreen");
const adminDashboard = document.getElementById("adminDashboard");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

const form = document.getElementById("videoForm");
const videoList = document.getElementById("videoList");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let editingVideoId = null;

// ==========================
// AUTH HELPERS
// ==========================
function getToken() {
  return localStorage.getItem("techtubeAdminToken");
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`
  };
}

// ==========================
// LOGIN CHECK
// ==========================
if (getToken()) {
  loginScreen.style.display = "none";
  adminDashboard.style.display = "block";
}

// ==========================
// LOGIN
// ==========================
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("adminUsername").value;
    const password = document.getElementById("adminPassword").value;

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        loginError.textContent = data.message || "Invalid username or password";
        return;
      }

      localStorage.setItem("techtubeAdminToken", data.token);

      loginScreen.style.display = "none";
      adminDashboard.style.display = "block";

      loadVideos();

    } catch (error) {
      loginError.textContent = "Could not connect to server";
    }
  });
}

// ==========================
// LOGOUT
// ==========================
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("techtubeAdminToken");
    location.reload();
  });
}

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

        <button class="edit-btn" onclick="editVideo('${video.id}')">
          Edit
        </button>

        <button class="delete-btn" onclick="deleteVideo('${video.id}')">
          Delete
        </button>
      `;

      videoList.appendChild(item);
    });

  } catch (error) {
    console.error(error);
  }
}

// ==========================
// EDIT VIDEO
// ==========================
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
// ADD / UPDATE VIDEO
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
      headers: {
        "Authorization": `Bearer ${getToken()}`
      },
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
      headers: getAuthHeaders(),
      body: JSON.stringify(videoData)
    });

    alert("Video updated successfully!");
  } else {
    await fetch(`${API_URL}/videos`, {
      method: "POST",
      headers: getAuthHeaders(),
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
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${getToken()}`
      }
    });

    loadVideos();

  } catch (error) {
    console.error(error);
  }
}

// ==========================
// CANCEL EDIT
// ==========================
if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    editingVideoId = null;
    form.reset();
    submitBtn.textContent = "Upload Video";
    cancelEditBtn.style.display = "none";
  });
}

// ==========================
// INITIAL LOAD
// ==========================
if (getToken()) {
  loadVideos();
}