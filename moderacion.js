const SUPABASE_URL = "https://uqhidatzjkokjfsczlty.supabase.co";
const SUPABASE_KEY = "sb_publishable_rKerGneQL7GizyvxKa4m-g_3KhXG2oN";

const loginContainer = document.getElementById("loginContainer");
const moderationContainer = document.getElementById("moderationContainer");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const pendingMessages = document.getElementById("pendingMessages");
const logoutButton = document.getElementById("logoutButton");

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

// Iniciar sesión
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginStatus.textContent = "Iniciando sesión...";

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || "Datos incorrectos");
    }

    localStorage.setItem("supabase_access_token", data.access_token);
    localStorage.setItem("supabase_refresh_token", data.refresh_token);

    showModeration();

  } catch (error) {
    console.error(error);
    loginStatus.textContent = "Email o contraseña incorrectos.";
  }
});

function showModeration() {
  loginContainer.classList.add("hidden");
  moderationContainer.classList.remove("hidden");
  loadPendingMessages();
}

// Cargar mensajes pendientes (approved = false)
async function loadPendingMessages() {
  pendingMessages.innerHTML = "Cargando...";

  const token = localStorage.getItem("supabase_access_token");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?select=*&approved=eq.false&order=created_at.desc`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("No se pudieron cargar los mensajes");
    }

    const messages = await response.json();

    if (messages.length === 0) {
      pendingMessages.innerHTML = "<p>No hay mensajes pendientes 🎉</p>";
      return;
    }

    pendingMessages.innerHTML = "";

    messages.forEach((item) => {
      const card = document.createElement("div");
      card.className = "moderation-card";

      card.innerHTML = `
        <p class="moderation-message">“${escapeHTML(item.message)}”</p>
        <p class="moderation-info">
          ${escapeHTML(item.city)}, ${escapeHTML(item.province)}${item.name ? ` · ${escapeHTML(item.name)}` : ""}
        </p>
        <div class="moderation-buttons">
          <button class="approve-button" data-id="${item.id}">✓ APROBAR</button>
          <button class="reject-button" data-id="${item.id}">✕ RECHAZAR</button>
        </div>
      `;

      card.querySelector(".approve-button").addEventListener("click", () => approveMessage(item.id));
      card.querySelector(".reject-button").addEventListener("click", () => rejectMessage(item.id));

      pendingMessages.appendChild(card);
    });

  } catch (error) {
    console.error(error);
    pendingMessages.innerHTML = "<p>No se pudieron cargar los mensajes.</p>";
  }
}

// Aprobar mensaje
async function approveMessage(id) {
  const token = localStorage.getItem("supabase_access_token");

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ approved: true })
    });

    if (response.ok) {
      loadPendingMessages();
    } else {
      alert("No se pudo aprobar el mensaje.");
    }
  } catch (err) {
    console.error(err);
    alert("Error de conexión al aprobar.");
  }
}

// Rechazar / borrar mensaje
async function rejectMessage(id) {
  const token = localStorage.getItem("supabase_access_token");

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      loadPendingMessages();
    } else {
      alert("No se pudo rechazar el mensaje.");
    }
  } catch (err) {
    console.error(err);
    alert("Error de conexión al rechazar.");
  }
}

// Cerrar sesión
logoutButton.addEventListener("click", () => {
  localStorage.removeItem("supabase_access_token");
  localStorage.removeItem("supabase_refresh_token");
  location.reload();
});

// Comprobar sesión al inicio
if (localStorage.getItem("supabase_access_token")) {
  showModeration();
}