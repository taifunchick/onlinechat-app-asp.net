let connection = null;
let currentUser = null;
let selectedUser = null;

const usernameInput = document.getElementById("usernameInput");
const joinBtn = document.getElementById("joinBtn");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const sendPrivateBtn = document.getElementById("sendPrivateBtn");
const messagesList = document.getElementById("messagesList");
const usersList = document.getElementById("usersList");
const userCount = document.getElementById("userCount");

function initConnection() {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("/chatHub")
        .build();

    connection.on("ReceiveMessage", (user, message, timestamp) => {
        addMessage(user, message, timestamp, false);
    });

    connection.on("ReceivePrivateMessage", (sender, message) => {
        addMessage(sender, message, new Date(), true);
    });

    connection.on("UserJoined", (username) => {
        addSystemMessage(`${username} joined the chat`);
    });

    connection.on("UserLeft", (username) => {
        addSystemMessage(`${username} left the chat`);
    });

    connection.on("UpdateUserList", (users) => {
        renderUsersList(users);
    });

    connection.start().catch(err => console.error(err));
}

function addMessage(user, message, timestamp, isPrivate) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isPrivate ? 'private' : 'public'}`;
    const time = new Date(timestamp).toLocaleTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <strong>${escapeHtml(user)}</strong>
            <small>${time}</small>
        </div>
        <div class="message-body">${escapeHtml(message)}</div>
    `;
    
    messagesList.appendChild(messageDiv);
    messagesList.scrollTop = messagesList.scrollHeight;
}

function addSystemMessage(message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message system";
    messageDiv.innerHTML = `<em>${escapeHtml(message)}</em>`;
    messagesList.appendChild(messageDiv);
    messagesList.scrollTop = messagesList.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function renderUsersList(users) {
    usersList.innerHTML = "";
    userCount.innerText = users.length;
    
    users.forEach(user => {
        const btn = document.createElement("button");
        btn.className = "list-group-item list-group-item-action user-item";
        btn.textContent = user;
        btn.onclick = () => {
            selectedUser = user;
            addSystemMessage(`Selected: ${user}. Click Private to send.`);
        };
        usersList.appendChild(btn);
    });
}

async function joinChat() {
    const username = usernameInput.value.trim();
    if (!username) {
        alert("Please enter your name");
        return;
    }
    
    currentUser = username;
    await connection.invoke("JoinChat", username);
    
    messageInput.disabled = false;
    sendBtn.disabled = false;
    sendPrivateBtn.disabled = false;
    usernameInput.disabled = true;
    joinBtn.disabled = true;
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    await connection.invoke("SendMessage", message);
    messageInput.value = "";
    messageInput.focus();
}

async function sendPrivateMessage() {
    if (!selectedUser) {
        alert("Click on a user from the list first");
        return;
    }
    
    const message = prompt(`Message to ${selectedUser}:`);
    if (message) {
        await connection.invoke("SendPrivateMessage", selectedUser, message);
    }
}

joinBtn.addEventListener("click", joinChat);
sendBtn.addEventListener("click", sendMessage);
sendPrivateBtn.addEventListener("click", sendPrivateMessage);
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

initConnection();