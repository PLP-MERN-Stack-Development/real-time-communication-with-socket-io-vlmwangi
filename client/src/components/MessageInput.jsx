import { useState, useEffect } from "react";
import socket from "../socket/socket";

export default function MessageInput() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.emit("typing", message.length > 0);
  }, [message]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send_message", { message });
    setMessage("");
    socket.emit("typing", false);
  };

  return (
    <div>
      <input
        style={{ padding: "10px", width: "80%" }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button style={{ padding: "10px" }} onClick={sendMessage}>
        Send
      </button>
    </div>
  );
}
