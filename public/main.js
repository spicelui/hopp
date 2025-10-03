const APP_KEY = "9j2w7gkmnw7looi"; // pon aquí tu App Key de Dropbox

document.getElementById("loginBtn").addEventListener("click", () => {
  const redirectUri = encodeURIComponent(window.location.href);
  const authUrl = `https://www.dropbox.com/oauth2/authorize?response_type=token&client_id=${APP_KEY}&redirect_uri=${redirectUri}`;
  window.location.href = authUrl;
});

window.addEventListener("load", async () => {
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    if (accessToken) {
      sessionStorage.setItem("dropboxToken", accessToken);
      showDashboard();
    }
  } else if (sessionStorage.getItem("dropboxToken")) {
    showDashboard();
  }
});

function showDashboard() {
  document.getElementById("login").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
}

document.getElementById("syncBtn").addEventListener("click", syncNotes);

async function syncNotes() {
  const token = sessionStorage.getItem("dropboxToken");
  if (!token) return alert("Debes iniciar sesión primero");

  const dbx = new Dropbox.Dropbox({
    accessToken: token,
    fetch: window.fetch
  });


  try {
    const folder = await dbx.filesListFolder({ path: '/journal' });
    document.getElementById("notes").innerHTML = "";

    for (const file of folder.result.entries) {
      if (file['.tag'] === 'file') {
        const content = await dbx.filesDownload({ path: file.path_lower });
        const blob = content.result.fileBlob || content.fileBlob;
        const text = await blob.text();

        try {
          const json = JSON.parse(text);
          displayNote(json);
        } catch (e) {
          console.warn("Archivo no es JSON válido:", file.name, text);
        }
      }
    }
  } catch (err) {
    console.error("Error en syncNotes:", err);
  }
}


function displayNote(note) {
  const notesDiv = document.getElementById("notes");
  const div = document.createElement("div");
  div.innerHTML = `<strong>${note.titulo}</strong> <br> <em>${note.fecha}</em> <br> ${note.cuerpo}`;
  notesDiv.appendChild(div);
}

