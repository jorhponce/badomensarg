const SUPABASE_URL = "https://uqhidatzjkokjfsczlty.supabase.co";
const SUPABASE_KEY = "sb_publishable_rKerGneQL7GizyvxKa4m-g_3KhXG2oN";

const messagesContainer = document.getElementById("messagesContainer");
const joinButton = document.getElementById("joinButton");
const formContainer = document.getElementById("formContainer");
const messageForm = document.getElementById("messageForm");
const formStatus = document.getElementById("formStatus");

// Función de seguridad para evitar inyección de código
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

// Cargar mensajes aprobados desde Supabase
async function loadMessages() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?select=*&approved=eq.true&order=created_at.desc`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("Error al obtener los mensajes");
    }

    const messages = await response.json();

    messagesContainer.innerHTML = "";

    if (messages.length === 0) {
      messagesContainer.innerHTML = "<p>Todavía no hay mensajes en el muro. ¡Sé el primero!</p>";
      return;
    }

    messages.forEach((item) => {
      const card = document.createElement("div");
      card.className = "message-card";

      const messageText = document.createElement("p");
      messageText.textContent = `“${item.message}”`;

      const info = document.createElement("span");
      info.textContent = `${item.city}, ${item.province}${item.name ? ` · ${item.name}` : ""}`;

      card.appendChild(messageText);
      card.appendChild(info);
      messagesContainer.appendChild(card);
    });

  } catch (error) {
    console.error("ERROR:", error);
    messagesContainer.innerHTML = "<p>No pudimos cargar los mensajes.</p>";
  }
}

// Botón para desplegar / ocultar el formulario
joinButton.addEventListener("click", () => {
  formContainer.classList.toggle("hidden");

  if (!formContainer.classList.contains("hidden")) {
    formContainer.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
});

// Enviar un nuevo mensaje (queda con approved = false)
messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const city = document.getElementById("city").value.trim();
  const province = document.getElementById("province").value;
  const message = document.getElementById("message").value.trim();

  formStatus.textContent = "Enviando...";

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        name: name || null,
        city,
        province,
        message,
        approved: false
      })
    });

    if (!response.ok) {
      throw new Error("No se pudo enviar el mensaje");
    }

    formStatus.textContent = "🇦🇷 ¡Mensaje enviado! Quedará pendiente de aprobación.";
    messageForm.reset();

  } catch (error) {
    console.error(error);
    formStatus.textContent = "No pudimos enviar el mensaje. Intentá nuevamente.";
  }
});

// Carga inicial
loadMessages();