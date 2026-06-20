const API_URL = "http://localhost:5000";

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

// ==========================
// ADD VIDEO
// ==========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let videoUrl = document.getElementById("video").value;
  const videoFile = document.getElementById("videoFile").files[0];

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

  await fetch(`${API_URL}/videos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(videoData)
  });

  form.reset();
  loadVideos();

  alert("Video uploaded successfully!");
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

// ==========================
// INITIAL LOAD
// ==========================
loadVideos();