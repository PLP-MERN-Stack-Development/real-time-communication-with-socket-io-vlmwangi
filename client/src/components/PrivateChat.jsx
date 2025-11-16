import { useState } from "react";
import socket from "../socket/socket";

export default function PrivateChat({ selectedUser, messages, username }) {
  const [input, setInput] = useState("");

  const sendPrivate = () => {
    if (!input.trim()) return;

    socket.emit("private_message", {
      to: selectedUser.id,
      message: input,
    });

    setInput("");
  };

  const filtered = messages.filter(
    (m) =>
      m.senderId === selectedUser.id || m.senderId === socket.id
  );

  return (
    <div style={{ flex: 1 }}>
      <h2>Chat with {selectedUser.username}</h2>

      <div
        style={{
          flex: 1,
          height: "70vh",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "1rem",
        }}
      >
        {filtered.map((msg) => (
          <p key={msg.id}>
            <strong>{msg.sender}: </strong>
            {msg.message}
          </p>
        ))}
      </div>

      <input
        style={{ padding: "10px", width: "80%" }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Private message..."
      />
      <button style={{ padding: "10px" }} onClick={sendPrivate}>
        Send
      </button>
    </div>
  );
}
