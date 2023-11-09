const chatBox = document.getElementById('chatBox');
const chatHeader = document.getElementById('chatHeader');
const minimizeButton = document.getElementById('minimizeButton');
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');

// Function to toggle chat box between minimized and maximized state
function toggleChatBox() {
  chatBox.classList.toggle('minimized');
  minimizeButton.textContent = chatBox.classList.contains('minimized') ? '+' : '-';
}

// Function to add user message to chat box
function addUserMessage(message) {
  const userMessage = document.createElement('div');
  userMessage.classList.add('chat-message', 'user');
  const messageContent = document.createElement('div');
  messageContent.classList.add('message-content');
  messageContent.textContent = message;
  userMessage.appendChild(messageContent);
  chatBody.appendChild(userMessage);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Function to add AI message to chat box
function addAIMessage(message) {
  const aiMessage = document.createElement('div');
  aiMessage.classList.add('chat-message', 'ai');
  const messageContent = document.createElement('div');
  messageContent.classList.add('message-content');
  messageContent.textContent = message;
  aiMessage.appendChild(messageContent);
  chatBody.appendChild(aiMessage);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Function to store chat history in local storage
function storeChatHistory() {
  const chatMessages = chatBody.innerHTML;
  localStorage.setItem('chatHistory', chatMessages);
}

// Function to load chat history from local storage
function loadChatHistory() {
  const chatMessages = localStorage.getItem('chatHistory');
  if (chatMessages) {
    chatBody.innerHTML = chatMessages;
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

// Event listener for minimize button
minimizeButton.addEventListener('click', toggleChatBox);

// Event listener for send button
sendButton.addEventListener('click', function () {
  const userMessage = chatInput.value.trim();
  if (userMessage !== '') {
    addUserMessage(userMessage);
    chatInput.value = '';
    // Replace with your AI response generation logic
    addAIMessage('This is an AI response.');
    storeChatHistory();
  }
});

// Event listener for Enter key press in chat input
chatInput.addEventListener('keypress', function (event) {
  if (event.keyCode === 13 || event.which === 13) {
    event.preventDefault();
    sendButton.click();
  }
});

// Load chat history when the page is loaded
document.addEventListener('DOMContentLoaded', loadChatHistory);
