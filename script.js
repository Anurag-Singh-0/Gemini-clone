const typingForm = document.querySelector(".search-form");
const chatList = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");

let userMessage = null;
let isResponseGenerating = false;

// API configuration
const API_KEY = "AIzaSyDEnHDq6lEJCJBr6xCdqrxex0bje-VI1b0";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const loadLocalStorageData = () => {
  const savedChats = localStorage.getItem("savedChats");
  const themeColor = localStorage.getItem("themeColor");
  const isLightMode = themeColor === "light";

  document.body.classList.toggle("light-mode", isLightMode);
  toggleThemeButton.innerHTML = isLightMode
    ? `<i class="ri-moon-line"></i>`
    : `<i class="ri-sun-line"></i>`;

  if (savedChats) {
    chatList.innerHTML = savedChats;
    setTimeout(() => chatList.scrollTo(0, chatList.scrollHeight), 0);
    document.body.classList.add("hide-header");
  }
};

loadLocalStorageData();

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];

    const iconElement = incomingMessageDiv.querySelector(".icon");
    if (iconElement) {
      iconElement.classList.add("hide");
    }

    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;

      if (iconElement) {
        iconElement.classList.remove("hide");
      }

      localStorage.setItem("savedChats", chatList.innerHTML);
      chatList.scrollTo(0, chatList.scrollHeight);
    }
  }, 75);
};

const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(date.error.message);

    const apiResponse = data?.candidates[0]?.content?.parts[0]?.text?.replace(
      /\*\*(.*?)\*\*/g,
      "$1"
    );

    if (!apiResponse) {
      throw new Error("API response is invalid or undefined.");
    }

    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.classList.add("error");
    textElement.innerText = "Error: Unable to fetch a response.";
    incomingMessageDiv.classList.remove("loading");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

const showLoadingAnimation = () => {
  const html = `
    <div class="message-content">
      <img src="/images/google-gemini-icon.svg" alt="Gemini logo" class="logo">
      <p class="text"></p>
      <div class="loading-indicator">
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
      </div>
    </div>
    <span onclick="copyMessage(this)"><i class="ri-file-copy-line"></i></span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);

  chatList.scrollTo(0, chatList.scrollHeight);
  generateAPIResponse(incomingMessageDiv);
};

const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerHTML = `<i class="ri-check-line"></i>`;
  setTimeout(
    () => (copyIcon.innerHTML = `<i class="ri-file-copy-line"></i>`),
    1000
  );
};

const handleOutgoingChat = () => {
  const inputElement = typingForm.querySelector("#user-input");
  if (!inputElement) {
    console.error("User input field not found.");
    return;
  }

  userMessage = inputElement.value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;

  const html = `
      <div class="message-content">
        <img src="/images/Perfil.jpg" alt="User" class="user">
        <p class="text"></p>
      </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatList.appendChild(outgoingMessageDiv);
  typingForm.reset();
  chatList.scrollTo(0, chatList.scrollHeight);

  // Hide header after sending the message
  document.body.classList.add("hide-header");

  setTimeout(showLoadingAnimation, 500);
};

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const toggleTheme = () => {
  const isLightMode = document.body.classList.toggle("light-mode");
  localStorage.setItem("themeColor", isLightMode ? "light" : "dark");
  toggleThemeButton.innerHTML = isLightMode
    ? `<i class="ri-moon-line"></i>`
    : `<i class="ri-sun-line"></i>`;
};

toggleThemeButton.addEventListener("click", toggleTheme);

typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});

deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all messages?")) {
    // Remove saved chats from localStorage
    localStorage.removeItem("savedChats");

    chatList.innerHTML = "";
    loadLocalStorageData(); // This will load saved chats and hide/show the header accordingly

    // Ensure header is shown
    document.body.classList.remove("hide-header");
  }
});

suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});
