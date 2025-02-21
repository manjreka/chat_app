import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Update with your backend URL

const Chat = () => {
  const [userId, setUserId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [chat, setChat] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);

  useEffect(() => {
    if (userId) {
      socket.emit("join", userId);
    }

    socket.on("private-message", ({ senderId, message }) => {
      setChat((prev) => [...prev, { senderId, message, type: "private" }]);
    });

    socket.on("group-message", ({ senderId, message, room }) => {
      setChat((prev) => [...prev, { senderId, message, type: "group", room }]);
    });

    socket.on("broadcast", ({ senderId, message }) => {
      setChat((prev) => [...prev, { senderId, message, type: "broadcast" }]);
    });

    return () => {
      socket.off("private-message");
      socket.off("group-message");
      socket.off("broadcast");
    };
  }, [userId]);

  const joinRoom = () => {
    if (room && !joinedRooms.includes(room)) {
      socket.emit("join-room", room);
      setJoinedRooms([...joinedRooms, room]);
    }
  };

  const sendPrivateMessage = () => {
    if (receiverId && message) {
      socket.emit("private-message", { senderId: userId, receiverId, message });
      setChat((prev) => [
        ...prev,
        { senderId: userId, message, type: "private" },
      ]);
      setMessage("");
    }
  };

  const sendGroupMessage = () => {
    if (room && message) {
      socket.emit("group-message", { room, senderId: userId, message });
      setMessage("");
    }
  };

  const sendBroadcast = () => {
    if (message) {
      socket.emit("broadcast", { senderId: userId, message });
      setMessage("");
    }
  };

  return (
    <div className="max-w-lg mx-auto m-5 p-4 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-bold text-center mb-4">Socket.io Chat</h2>

      <div className="flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Enter your User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="p-2 border rounded"
        />

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Room Name"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="p-2 border rounded flex-1"
          />
          <button
            onClick={joinRoom}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Join Room
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Receiver ID"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            className="p-2 border rounded flex-1"
          />
          <button
            onClick={sendPrivateMessage}
            className="bg-green-500 text-white p-2 rounded"
          >
            Send Private
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="p-2 border rounded flex-1"
          />
          <button
            onClick={sendGroupMessage}
            className="bg-purple-500 text-white p-2 rounded"
          >
            Send to Group
          </button>
          <button
            onClick={sendBroadcast}
            className="bg-red-500 text-white p-2 rounded"
          >
            Broadcast
          </button>
        </div>
      </div>

      <div className="mt-4 p-4 bg-white border rounded shadow h-64 overflow-y-auto">
        {chat.map((msg, index) => (
          <p
            key={index}
            className={
              msg.type === "private"
                ? "text-green-500"
                : msg.type === "group"
                ? "text-purple-500"
                : "text-red-500"
            }
          >
            <strong>{msg.senderId}</strong>{" "}
            {msg.type === "group" ? `in ${msg.room}` : ""}: {msg.message}
          </p>
        ))}
      </div>
    </div>
  );
};

export default Chat;

// chat list update in onclick is to ensure that ui reflects the message which is been send by you
// chat list update in useeffect is to ensure that ui updates when ever there is a new message coming in from other users
