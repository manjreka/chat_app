import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// create socket
const socket = io("http://localhost:5000"); // Replace with your backend URL

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [name, setname] = useState("");

  const messageListener = (message) => {
    setMessages((prev) => [...prev, message]);
  };
  useEffect(() => {
    socket.on("message", messageListener);

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server"); // if user choose to disconnect
    });

    // clean up activities
    return () => {
      socket.off("message", messageListener); // will prevent duplicate messages or any memory leaks
      socket.off("disconnect"); // when component unmounts
    };
  }, []);

  useEffect(() => {
    const username = prompt("Enter your Name:");
    setname(username);
  }, []);

  const sendMessage = () => {
    socket.emit("message", {
      text: input,
      name,
      time: new Date().toLocaleTimeString(),
      sender: socket.id,
    }); // Use socket.id as sender
    setInput("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">
          Chat Application
        </h1>
        <p className="font-bold text-lg text-blue-900">welcome {name}</p>
        <ul className="h-60 overflow-y-auto border p-4 rounded bg-gray-50">
          {messages.map((each, index) => (
            <li
              className={`p-2 rounded  mb-2 ${
                each.sender === socket.id
                  ? "text-right bg-blue-200"
                  : "text-left bg-gray-200"
              }`}
            >
              <p className="text-[12px] text-red-500 font-bold">{each.name}</p>
              <p key={index}>{each.text}</p>
              <p className="text-[12px] text-end">{each.time}</p>
            </li>
          ))}
        </ul>
        <div className="flex mt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
