const APP_KEY = "9j2w7gkmnw7looi";
const REDIRECT_URI = "https://spicelui.github.io/hopp/public/index.html"; // tu redirect exacto

// ------------------- Login -------------------
document.getElementById("loginBtn").addEventListener("click", () => {
  sessionStorage.removeItem("dropboxToken"); // limpia token viejo
  const authUrl = `https://www.dropbox.com/oauth2/authorize
    ?response_type=token
    &client_id=${APP_KEY}
    &redirect_uri=${encodeURIComponent(REDIRECT_URI)}
    &token_access_type=online
    &scope=files.metadata.read files.content.read files.content.write`
    .replace(/\s+/g, ""); // quita saltos de línea
  window.location.href = authUrl;
});

// Detecta token después del login
window.addEventListener("load", () => {
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.slice(1));
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

// ------------------- Sync Notes -------------------
document.getElementById("syncBtn").addEventListener("click", syncNotes);

async function syncNotes() {
  const token = sessionStorage.getItem("dropboxToken");
  if (!token) return alert("Debes iniciar sesión primero");

  const dbx = new Dropbox.Dropbox({ accessToken: token });

  try {
    const folder = await dbx.filesListFolder({ path: '' });
    console.log("Archivos en la app folder:", folder.entries);

    document.getElementById("notes").innerHTML = "";

    for (const file of folder.entries) {
      if (file[".tag"] !== "file") continue;

      // Descargar archivo
      const content = await dbx.filesDownload({ path: file.path_lower });
      const blob = content.result?.fileBlob || content.fileBlob;
      const text = await blob.text();

      try {
        const json = JSON.parse(text);
        displayNote(json);
      } catch (e) {
        console.warn("Archivo no es JSON válido:", file.name);
      }
    }
  } catch (err) {
    console.error("Error en syncNotes:", err.error_summary || err);
  }
}

// ------------------- Display -------------------
function displayNote(note) {
  const notesDiv = document.getElementById("notes");
  const div = document.createElement("div");
  div.innerHTML = `<strong>${note.titulo}</strong> <br> <em>${note.fecha}</em> <br> ${note.cuerpo}`;
  notesDiv.appendChild(div);
}
