import React, { useState, useEffect } from "react";

const App = () => {
  const [users] = useState(["Alice", "Bob", "Charlie"]); // Sample users
  const [selectedUser, setSelectedUser] = useState(null); // Chat partner
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState(null);
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const socket = new WebSocket("ws://localhost:5000");

    socket.onopen = () => {
      console.log("Connected to server");
      socket.send(JSON.stringify({ type: "register", username: currentUser }));
    };

    socket.onmessage = async (event) => {
      const text =
        event.data instanceof Blob ? await event.data.text() : event.data;
      try {
        const data = JSON.parse(text);
        if (data.receiver === currentUser || data.sender === currentUser) {
          setMessages((prev) => [...prev, data]);
          updateLocalCache(data); // Store new messages in local storage
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };

    socket.onclose = () => console.log("Disconnected from server");
    setWs(socket);

    return () => socket.close();
  }, [currentUser]);

  const sendMessage = () => {
    if (ws && input.trim() && selectedUser) {
      const newMessage = {
        type: "message",
        sender: currentUser,
        receiver: selectedUser,
        text: input,
      };

      // Optimistically update UI & Cache
      setMessages((prev) => [...prev, newMessage]);
      updateLocalCache(newMessage);

      // Send message via WebSocket
      ws.send(JSON.stringify(newMessage));

      // Send to DB in the background
      fetch("http://localhost:5000/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });

      setInput(""); // Clear input field
    }
  };

  const fetchMessages = async () => {
    if (currentUser && selectedUser) {
      const cacheKey = `chat_${currentUser}_${selectedUser}`;
      const cachedMessages = localStorage.getItem(cacheKey);

      if (cachedMessages) {
        setMessages(JSON.parse(cachedMessages)); // Load from cache
      } else {
        const response = await fetch(
          `http://localhost:5000/messages/${currentUser}/${selectedUser}`
        );
        const data = await response.json();
        setMessages(data);
        localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in cache
      }
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedUser]);

  const updateLocalCache = (newMessage) => {
    const cacheKey = `chat_${currentUser}_${selectedUser}`;
    let cachedMessages = localStorage.getItem(cacheKey);
    cachedMessages = cachedMessages ? JSON.parse(cachedMessages) : [];
    cachedMessages.push(newMessage);
    localStorage.setItem(cacheKey, JSON.stringify(cachedMessages));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f4f4f4",
      }}
    >
      {!currentUser ? (
        <div
          style={{
            textAlign: "center",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2 style={{ color: "#333" }}>Select your name</h2>
          <div>
            {users.map((user) => (
              <button
                key={user}
                onClick={() => setCurrentUser(user)}
                style={{
                  padding: "10px 20px",
                  margin: "5px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  backgroundColor: "#007BFF",
                  color: "white",
                  fontSize: "16px",
                  transition: "0.3s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#0056b3")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "#007BFF")}
              >
                {user}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            width: "90vw",
            height: "90vh",
            backgroundColor: "white",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "25%",
              borderRight: "1px solid #ddd",
              padding: "15px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <h3 style={{ marginBottom: "15px", color: "#333" }}>Users</h3>
            {users
              .filter((user) => user !== currentUser)
              .map((user) => (
                <p
                  key={user}
                  onClick={() => setSelectedUser(user)}
                  style={{
                    cursor: "pointer",
                    padding: "10px",
                    borderRadius: "5px",
                    backgroundColor:
                      selectedUser === user ? "#007BFF" : "white",
                    color: selectedUser === user ? "white" : "#333",
                    transition: "0.3s",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.backgroundColor = "#e0e0e0")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.backgroundColor =
                      selectedUser === user ? "#007BFF" : "white")
                  }
                >
                  {user}
                </p>
              ))}
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "15px",
            }}
          >
            <h2 style={{ textAlign: "center", color: "#333" }}>
              {currentUser}
            </h2>
            {selectedUser ? (
              <>
                <h3 style={{ textAlign: "center", color: "#007BFF" }}>
                  Chat with {selectedUser}
                </h3>
                <div
                  style={{
                    flex: 1,
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    backgroundColor: "#fff",
                    height: "300px",
                    overflowY: "scroll",
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {messages.map((msg, index) => (
                    <p
                      key={index}
                      style={{
                        maxWidth: "60%",
                        padding: "10px",
                        borderRadius: "10px",
                        marginBottom: "5px",
                        color: msg.sender === currentUser ? "white" : "black",
                        backgroundColor:
                          msg.sender === currentUser ? "#007BFF" : "#e0e0e0",
                        alignSelf:
                          msg.sender === currentUser
                            ? "flex-end"
                            : "flex-start",
                      }}
                    >
                      {msg.text}
                    </p>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    marginTop: "10px",
                    borderTop: "1px solid #ddd",
                    paddingTop: "10px",
                  }}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      fontSize: "16px",
                    }}
                  />
                  <button onClick={sendMessage}>Send</button>
                </div>
              </>
            ) : (
              <h3>Select a user to chat</h3>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
