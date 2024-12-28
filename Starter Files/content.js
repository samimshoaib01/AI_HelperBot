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
    script1.src = chrome.runtime.getURL("prompt.js");
    document.documentElement.appendChild(script1);

    const script2 = document.createElement("script");
    script2.src = chrome.runtime.getURL("scraper.js");
    document.documentElement.appendChild(script2);

    script1.remove();
    script2.remove();
}

function getProblemKey() {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/problems\/([\w-]+)/);
    console.log(match);
    console.log("key genereation");

    return match ? match[1] : null;
}

function saveChat(problemKey, chatHistory) {
    if (problemKey) {
        const storageObj = {};
        storageObj[problemKey] = chatHistory; // Store key-value pair
        chrome.storage.local.set(storageObj, () => {
            console.log(`Chat history saved for problem key: ${problemKey}`);
        });
    }
}

function loadChat(problemKey) {
    return new Promise((resolve) => {
        if (problemKey) {
            chrome.storage.local.get(problemKey, (result) => {
                resolve(result[problemKey] || []);
            });
        } else {
            resolve([]);
        }
    });
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
    const navContainer = document.querySelector(
        '.coding_nav_bg__HRkIn > ul.d-flex.flex-row.p-0.gap-2.justify-content-between.m-0.hide-scrollbar'
    );

    if (navContainer) {
        const listItem = document.createElement("li");
        listItem.className = "d-flex flex-row rounded-3 dmsans align-items-center coding_list__V_ZOZ coding_card_mod_unactive__O_IEq";
        listItem.style.padding = "0.36rem 1rem";

        listItem.innerHTML = `
            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" class="me-1" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548-.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <span class="coding_ask_doubt_gradient_text__FX_hZ">Ask AI</span>
        `;

        listItem.addEventListener("click", () => {
            const chatbox = document.getElementById("CHAT_CONTAINER_ID");
            if (chatbox) {
                chatbox.style.display = chatbox.style.display === "block" ? "none" : "block";
            } else {
                console.log("Chatbox not found.");
            }
        });

        navContainer.appendChild(listItem);

        // Ensure the chatbox functionality is initialized
        addChatbox();
    } else {
        console.log("Navigation container not found.");
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


// Create a MutationObserver to monitor the light/dark mode switch
const modeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
            const switchButton = mutation.target;
            const isDarkMode = switchButton.getAttribute("aria-checked") === "true";
            if (isDarkMode) {
                console.log("Dark mode is now enabled.");
                // Add logic to apply dark mode changes
            } else {
                console.log("Light mode is now enabled.");
                // Add logic to apply light mode changes
            }
        }
    });
});

// Start observing the light/dark mode switch
function observeModeSwitch() {
    const modeSwitch = document.querySelector(".ant-switch[role='switch']");
    if (modeSwitch) {
        modeObserver.observe(modeSwitch, { attributes: true, attributeFilter: ["aria-checked", "class"] });
        console.log("Started observing the mode switch for changes.");
    } else {
        console.log("Mode switch not found. Retrying...");
        setTimeout(observeModeSwitch, 1000); // Retry after 1 second if the switch isn't available yet
    }
}

// Initialize the observer
observeModeSwitch();














function addChatbox() {
    const problemKey = getProblemKey();

    loadChat(problemKey).then((chatHistory) => {
        const chatboxHTML = `
            <div id="CHAT_CONTAINER_ID" style="
                display: none;
                position: fixed;
                bottom: 15px;
                left: 73px;
                width: calc(50% - 47px);
                background-color: #ffffff;
                border: 2px solid #0dcaf0;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
                transition: all 0.3s ease;
            ">
                <div id="chat-header" style="
                    background:rgb(209, 239, 250);
                    color: #333;
                    padding: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span style="font-weight: 600; font-size: 16px;">Coding Assistant</span>
                    <button id="close-chatbox" style="
                        background: none;
                        border: none;
                        color: #333;
                        cursor: pointer;
                        font-size: 18px;
                        padding: 5px;
                        opacity: 0.8;
                        transition: opacity 0.2s;
                    ">×</button>
                </div>
                <div id="chat-content" style="
                    height:  508px;
                    overflow-y: auto;
                    padding: 16px;
                    background-color: #f8f9fa;
                ">
                    <div id="chat-messages"></div>
                </div>
                <div id="chat-input" style="
                    padding: 12px;
                    background-color: white;
                    display: flex;
                    gap: 8px;
                ">
                    <input type="text" id="chat-message-input" style="
                        flex: 1;
                        padding: 10px;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        outline: none;
                        font-size: 14px;
                        transition: border-color 0.2s;
                    " placeholder="Type your message...">
                    <button id="send-message" style="
                        background: #a4e6ff;
                        color: #333;
                        border: none;
                        border-radius: 8px;
                        padding: 10px 20px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s;
                    ">Send</button>
                </div>
            </div>
        `
           
        ;
        document.body.insertAdjacentHTML("beforeend", chatboxHTML);

        const chatbox = document.getElementById("CHAT_CONTAINER_ID");
        const chatHeader = document.getElementById("chat-header");
        const chatContent = document.getElementById("chat-content");
        const chatInput = document.getElementById("chat-input");
        const chatMessages = document.getElementById("chat-messages");
        const closeChatboxButton = document.getElementById("close-chatbox");
        const sendMessageButton = document.getElementById("send-message");
        const chatMessageInput = document.getElementById("chat-message-input");


        // Add hover effects
        closeChatboxButton.addEventListener("mouseover", () => closeChatboxButton.style.opacity = "1");
        closeChatboxButton.addEventListener("mouseout", () => closeChatboxButton.style.opacity = "0.8");
        sendMessageButton.addEventListener("mouseover", () => {
            sendMessageButton.style.background = "#0dcaf0";
            sendMessageButton.style.color = "white";
        });
        sendMessageButton.addEventListener("mouseout", () => {
            sendMessageButton.style.background = "#a4e6ff";
            sendMessageButton.style.color = "#333";
        });
        
        // Focus effect for input
        chatMessageInput.addEventListener("focus", () => {
            chatMessageInput.style.borderColor = "#0dcaf0";
            chatMessageInput.style.boxShadow = "0 0 0 3px rgba(13, 202, 240, 0.2)";
        });
        chatMessageInput.addEventListener("blur", () => {
            chatMessageInput.style.borderColor = "#0dcaf0";
            chatMessageInput.style.boxShadow = "none";
        });

        // Load previous chat history into chatbox
        chatHistory.forEach(({ sender, message }) => {
            appendMessageToChat(sender, message, chatMessages);
        });

        closeChatboxButton.addEventListener("click", () => {
            chatbox.style.display = "none";
        });

        // Enter key support
        chatMessageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendMessageButton.click();
            }
        });

        sendMessageButton.addEventListener("click", async () => {
            const userMessage = chatMessageInput.value.trim();
            if (userMessage !== "") {
                appendMessageToChat("You", userMessage, chatMessages);

                chatMessageInput.value = "";
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // Save user's message
                chatHistory.push({ sender: "You", message: userMessage });
                saveChat(problemKey, chatHistory);

                try {
                    const problemDetails = window.getProblemContextAndDetails();
                    console.log(problemDetails);

                    const editorialText = editorialCode.length > 0
                        ? `Editorial Code: ${editorialCode.map(entry => `${entry.language}: ${entry.code}`).join("\n")}`
                        : "No editorial code available.";

                    const hintsText = Object.keys(hints).length > 0
                        ? `Hints: ${Object.entries(hints).map(([key, value]) => `${key}: ${value}`).join("\n")}`
                        : "No hints available.";

                    const fullPrompt = window.generatePrompt(problemDetails, hintsText, editorialText, userMessage);

                    console.log(fullPrompt);

                    const aiResponse = await fetchAIResponse(fullPrompt);

                    appendMessageToChat("AI", aiResponse, chatMessages);

                    // Save AI's response
                    chatHistory.push({ sender: "AI", message: aiResponse });
                    saveChat(problemKey, chatHistory);

                    chatMessages.scrollTop = chatMessages.scrollHeight;
                } catch (error) {
                    console.error("Error processing AI request:", error);
                    appendMessageToChat("AI", "Sorry, I couldn't process your request.", chatMessages, true);
                }
            }
        });
    });

    function appendMessageToChat(sender, message, chatMessages, isError = false) {
        const messageDiv = document.createElement("div");
        messageDiv.style.marginBottom = "16px";
        messageDiv.style.display = "flex";
        messageDiv.style.flexDirection = "column";
        messageDiv.style.alignItems = sender === "You" ? "flex-end" : "flex-start";

        const messageBubble = document.createElement("div");
        messageBubble.style.maxWidth = "80%";
        messageBubble.style.padding = "12px 16px";
        messageBubble.style.borderRadius = sender === "You" ? "18px 18px 4px 18px" : "18px 18px 18px 4px";
        messageBubble.style.backgroundColor = sender === "You" ? "#a4e6ff" : "white";
        messageBubble.style.color = "#333";
        messageBubble.style.border = `2px solid ${sender === "You" ? "#0dcaf0" : "#e0e0e0"}`;

        const senderName = document.createElement("div");
        senderName.style.fontSize = "12px";
        senderName.style.marginBottom = "4px";
        senderName.style.color = "#666";
        senderName.textContent = sender;

        if (message.includes("```")) {
            const codeBlock = extractCodeBlock(message);
            messageBubble.innerHTML = `
                <div style="
                    background: #1e1e1e;
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 8px;
                    position: relative;
                    border: 2px solid #0dcaf0;
                ">
                    <pre style="
                        margin: 0;
                        font-family: 'Fira Code', monospace;
                        font-size: 13px;
                        color: #d4d4d4;
                        overflow-x: auto;
                    ">${codeBlock}</pre>
                    <button style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: #0dcaf0;
                        color: white;
                        border: none;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: background 0.2s;
                    " onclick="copyToClipboard(\`${escapeHtml(codeBlock)}\`)">Copy</button>
                </div>
            `;
        } else {
            messageBubble.textContent = message;
            if (isError) {
                messageBubble.style.backgroundColor = "#fee";
                messageBubble.style.color = "#c00";
                messageBubble.style.border = "2px solid #c00";
            }
        }

        messageDiv.appendChild(senderName);
        messageDiv.appendChild(messageBubble);
        chatMessages.appendChild(messageDiv);
    }

    function extractCodeBlock(message) {
        const codeMatch = message.match(/```([\s\S]*?)```/);
        return codeMatch ? codeMatch[1] : message;
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Code copied to clipboard!");
        }).catch((err) => {
            console.error("Failed to copy text:", err);
        });
    };
}