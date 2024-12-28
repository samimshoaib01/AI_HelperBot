// content.js
// Author:
// Author URI: https://
// Author Github URI: https://www.github.com/
// Project Repository URI: https://github.com/
// Description: Handles all the webpage-level activities (e.g., manipulating page data, etc.)
// License: MIT

let lastPageVisited = "";

// Define global variables to hold the editorial code and hints data
let editorialCode = [];
let hints = {};

// Observe DOM changes
const observer = new MutationObserver(() => {
    handleContentChange();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial content change check
handleContentChange();

function handleContentChange() {
    if (isPageChange()) handlePageChange();
}

function isPageChange() {
    const currentPage = window.location.pathname;
    if (currentPage === lastPageVisited) return false;
    lastPageVisited = currentPage;
    return true;
}

function handlePageChange() {
    if (onTargetPage()) {
        cleanUpPage();
        addInjectScripts();
        addAIChatbotButton();
    }
}

function onTargetPage() {
    const pathname = window.location.pathname;
    return pathname.startsWith("/problems/") && pathname.length > "/problems/".length;
}

function cleanUpPage() {
    const existingButton = document.getElementById("AI_HELPER_BUTTON_ID");
    if (existingButton) {
        existingButton.remove();
    }

    const existingChatContainer = document.getElementById("CHAT_CONTAINER_ID");
    if (existingChatContainer) {
        existingChatContainer.remove();
    }
}

function addInjectScripts() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("inject.js");
    document.documentElement.insertAdjacentElement("afterbegin", script);
    script.remove();

    const script1 = document.createElement("script");
    script1.src = chrome.runtime.getURL("abc.js");
    document.documentElement.appendChild(script1);

    const script2 = document.createElement("script");
    script2.src = chrome.runtime.getURL("def.js");
    document.documentElement.appendChild(script2);

    script1.remove();
    script2.remove();
}

// Updated listener for messages from the page context
window.addEventListener("message", (event) => {
    if (event.source !== window || event.data.type !== "xhrDataFetched") {
        return; // Ignore messages that don't match the expected type
    }

    const { url, response } = event.data.detail;

    console.log("API Request URL:", url);
    console.log("API Response:", response);

    if (url.startsWith("https://api2.maang.in/problems/user/")) {
        try {
            const jsonResponse = JSON.parse(response);

            // Extract editorial code and hints
            const { editorial_code, hints: responseHints } = jsonResponse.data;

            if (editorial_code && editorial_code.length > 0) {
                editorial_code.forEach((codeEntry) => {
                    console.log(`Editorial Code (${codeEntry.language}):\n${codeEntry.code}`);
                });
                editorialCode = editorial_code;
            } else {
                console.log("No editorial code available in the response.");
            }

            if (responseHints) {
                console.log("Hints:");
                Object.keys(responseHints).forEach((key) => {
                    console.log(`${key}: ${responseHints[key] || "No value provided"}`);
                });
                hints = responseHints;
            } else {
                console.log("No hints available in the response.");
            }
        } catch (error) {
            console.error("Failed to parse the response or extract editorial code and hints:", error);
        }
    }
});

function addAIChatbotButton() {
    const targetDiv = document.querySelector(".ant-row.d-flex.gap-4.mt-3.css-19gw05y");

    if (targetDiv) {
        const button = document.createElement("button");
        button.type = "button";
        button.id = "AI_HELPER_BUTTON_ID";
        button.className =
            "ant-btn css-19gw05y ant-btn-default Button_gradient_light_button__ZDAR_ coding_ask_doubt_button__FjwXJ gap-1 py-2 px-3 overflow-hidden";
        button.style.height = "fit-content";
        button.innerHTML = `
            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548-.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <span class="coding_ask_doubt_gradient_text__FX_hZ">Ask AI</span>
        `;

        targetDiv.appendChild(button);

        addChatbox();

        button.addEventListener("click", () => {
            const chatbox = document.getElementById("CHAT_CONTAINER_ID");
            chatbox.style.display = chatbox.style.display === "block" ? "none" : "block";
        });
    } else {
        console.log("Target div not found.");
    }
}

async function fetchAIResponse(messageText) {
    const apiKey = "AIzaSyDbSYcg4DsyjW0SPv9OkzKcDzY_ejOJTFE"; // Replace with your actual API key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: messageText }],
                    },
                ],
            }),
        });

        const responseData = await response.json();
        console.log("API Response:", responseData);

        if (
            responseData &&
            responseData.candidates &&
            Array.isArray(responseData.candidates) &&
            responseData.candidates.length > 0
        ) {
            return responseData.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Unexpected API response structure");
        }
    } catch (error) {
        console.error("Error calling AI API:", error);
        throw error;
    }
}

function addChatbox() {
    const chatboxHTML = `
        <div id="CHAT_CONTAINER_ID" style="display: none; position: fixed; bottom: 10px; right: 10px; width: 300px; background-color: white; border: 1px solid #007bff; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <div id="chat-header" style="background-color: #007bff; color: white; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span>Chatbox</span>
                <button id="close-chatbox" style="background: none; border: none; color: white; cursor: pointer;">X</button>
            </div>
            <div id="chat-content" style="height: 300px; overflow-y: auto; padding: 10px;">
                <div id="chat-messages"></div>
            </div>
            <div id="chat-input" style="padding: 10px; border-top: 1px solid #ddd;">
                <input type="text" id="chat-message-input" style="width: 80%;" placeholder="Type your message here">
                <button id="send-message" style="width: 18%; background-color: #007bff; color: white;">Send</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", chatboxHTML);

    const chatbox = document.getElementById("CHAT_CONTAINER_ID");
    const chatMessageInput = document.getElementById("chat-message-input");
    const chatMessages = document.getElementById("chat-messages");
    const closeChatboxButton = document.getElementById("close-chatbox");
    const sendMessageButton = document.getElementById("send-message");

    closeChatboxButton.addEventListener("click", () => {
        chatbox.style.display = "none";
    });

    sendMessageButton.addEventListener("click", async () => {
        const userMessage = chatMessageInput.value.trim();
        if (userMessage !== "") {
            const userMessageDiv = document.createElement("div");
            userMessageDiv.textContent = `You: ${userMessage}`;
            userMessageDiv.style.color = "#007bff";
            userMessageDiv.style.textAlign = "right";
            chatMessages.appendChild(userMessageDiv);

            chatMessageInput.value = "";
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                const problemDetails = window.getProblemContextAndDetails();
                console.log(problemDetails);

                const editorialText = editorialCode.length > 0
                    ? `Editorial Code: ${editorialCode.map(entry => `${entry.language}: ${entry.code}`).join("\n")}`
                    : "No editorial code available.";

                const hintsText = Object.keys(hints).length > 0
                    ? `Hints: ${Object.entries(hints).map(([key, value]) => `${key}: ${value}`).join("\n")}`
                    : "No hints available.";

                const fullPrompt = window.generatePrompt(problemDetails, userMessage) + "\n\n" + editorialText + "\n\n" + hintsText;

                console.log(fullPrompt);

                const aiResponse = await fetchAIResponse(fullPrompt);

                const aiMessageDiv = document.createElement("div");
                aiMessageDiv.textContent = `AI: ${aiResponse}`;
                aiMessageDiv.style.color = "black";
                chatMessages.appendChild(aiMessageDiv);

                chatMessages.scrollTop = chatMessages.scrollHeight;
            } catch (error) {
                console.error("Error processing AI request:", error);
                const errorMessageDiv = document.createElement("div");
                errorMessageDiv.textContent = "AI: Sorry, I couldn't process your request.";
                errorMessageDiv.style.color = "red";
                chatMessages.appendChild(errorMessageDiv);
            }
        }
    });
}
