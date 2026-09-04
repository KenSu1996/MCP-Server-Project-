(() => {
    const history = [];

    // ================================
    // Floating button
    // ================================

    const openButton = document.createElement("button");

    openButton.id = "ai-chat-open";
    openButton.type = "button";
    openButton.innerHTML = "✨ AI";

    document.body.appendChild(openButton);


    // ================================
    // Chat panel
    // ================================

    const panel = document.createElement("div");

    panel.id = "ai-chat-panel";

    panel.innerHTML = `
        <div class="ai-chat-header">

            <div>
                <strong>AI Page Designer</strong>
                <div class="ai-chat-subtitle">
                    Ollama + MCP
                </div>
            </div>

            <button
                id="ai-chat-close"
                type="button">
                ×
            </button>

        </div>


        <div
            id="ai-chat-messages"
            class="ai-chat-messages">

            <div class="ai-message assistant">
                Tell me what you want to change on this page.
            </div>

        </div>


        <div class="ai-chat-footer">

            <textarea
                id="ai-chat-input"
                placeholder="例如：把 Banner 标题改成 Welcome，然后添加一段介绍..."
            ></textarea>

            <div class="ai-chat-actions">

                <button
                    id="ai-chat-refresh"
                    type="button">
                    Refresh
                </button>

                <button
                    id="ai-chat-send"
                    type="button">
                    Send
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(panel);


    const messages =
        document.getElementById("ai-chat-messages");

    const input =
        document.getElementById("ai-chat-input");

    const sendButton =
        document.getElementById("ai-chat-send");


    // ================================
    // Get current Piranha Page ID
    // ================================

    function getCurrentPageId() {

        const match =
            window.location.pathname.match(
                /\/manager\/page\/edit\/([0-9a-f-]{36})/i
            );

        if (!match) {
            return null;
        }

        return match[1];
    }


    // ================================
    // Add message to UI
    // ================================

    function addMessage(role, text) {

        const element =
            document.createElement("div");

        element.className =
            `ai-message ${role}`;

        element.textContent = text;

        messages.appendChild(element);

        messages.scrollTop =
            messages.scrollHeight;
    }


    // ================================
    // Send message
    // ================================

    async function sendMessage() {

        const text =
            input.value.trim();

        if (!text) {
            return;
        }

        const pageId =
            getCurrentPageId();


        if (!pageId) {

            addMessage(
                "assistant",
                "Open a Piranha page in edit mode first."
            );

            return;
        }


        input.value = "";

        addMessage(
            "user",
            text
        );


        sendButton.disabled = true;
        sendButton.textContent = "Working...";


        try {

            const response =
                await fetch(
                    "/ai/chat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            message: text,
                            pageId: pageId
                        })
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();

                throw new Error(
                    `${response.status}: ${errorText}`
                );
            }


            const result =
                await response.json();


            addMessage(
                "assistant",
                result.reply
            );


            history.push({
                role: "user",
                content: text
            });

            history.push({
                role: "assistant",
                content: result.reply
            });

        }
        catch (error) {

            console.error(error);

            addMessage(
                "assistant",
                "Something went wrong: " +
                error.message
            );

        }
        finally {

            sendButton.disabled = false;
            sendButton.textContent = "Send";

        }
    }


    // ================================
    // Events
    // ================================

    openButton.addEventListener(
        "click",
        () => {
            panel.classList.add("open");
        }
    );


    document
        .getElementById("ai-chat-close")
        .addEventListener(
            "click",
            () => {
                panel.classList.remove("open");
            }
        );


    sendButton.addEventListener(
        "click",
        sendMessage
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {
                event.preventDefault();

                sendMessage();
            }

        }
    );


    document
        .getElementById("ai-chat-refresh")
        .addEventListener(
            "click",
            () => {
                window.location.reload();
            }
        );

})();