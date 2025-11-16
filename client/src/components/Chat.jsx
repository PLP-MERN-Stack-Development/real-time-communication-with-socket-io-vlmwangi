import { useEffect, useRef, useState } from "react";
import socket from "../socket/socket";
import UserList from "./UserList.jsx";
import MessageBubble from "./MessageBubble.jsx";
import MessageInput from "./MessageInput.jsx";

export default function Chat({ username }) {
  const [messages, setMessages] = useState([]); // all messages
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesRef = useRef();
  const audioRef = useRef(null);

  useEffect(() => {
    // register user
    socket.emit("user_join", username);

    // listeners
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);

      // If page hidden, show browser notification
      if (document.hidden && Notification.permission === "granted") {
        new Notification(`${msg.sender}`, { body: msg.message });
      }

      // Immediately ACK delivered back to server for this client
      socket.emit("delivered", { messageId: msg.id });
    });

    socket.on("private_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      try { audioRef.current.play().catch(()=>{}); } catch(e) {}
      if (document.hidden && Notification.permission === "granted") {
        new Notification(`PM from ${msg.sender}`, { body: msg.message });
      }
      socket.emit("delivered", { messageId: msg.id });
    });

    socket.on("user_list", (list) => setOnlineUsers(list));
    socket.on("typing_users", (list) => setTypingUsers(list));

    // Incoming delivered/read updates from server for messages you sent
    socket.on("message_delivered", ({ messageId, deliveredBy, deliveredByUsername }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(messageId) && !m.deliveredBy?.includes(deliveredBy)
            ? { ...m, deliveredBy: [...(m.deliveredBy || []), deliveredBy] }
            : m
        )
      );
    });

    socket.on("message_read", ({ messageId, readBy, readByUsername }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(messageId) && !m.readBy?.includes(readBy)
            ? { ...m, readBy: [...(m.readBy || []), readBy] }
            : m
        )
      );
    });

    // Request notification permission once
    if (Notification && Notification.permission === "default") {
      Notification.requestPermission().catch(()=>{});
    }

    return () => {
      socket.off("receive_message");
      socket.off("private_message");
      socket.off("user_list");
      socket.off("typing_users");
      socket.off("message_delivered");
      socket.off("message_read");
    };
  }, [username]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // User clicked on a message to mark as read (manual read)
  const markAsRead = (messageId) => {
    socket.emit("read", { messageId });
    // optimistically update UI
    setMessages((prev) =>
      prev.map((m) => (String(m.id) === String(messageId) ? { ...m, readBy: [...(m.readBy||[]), socket.id] } : m))
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <UserList users={onlineUsers} currentUser={socket.id} selectUser={setSelectedUser} />
      <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column" }}>
        <h2>Global Chat</h2>
        <div ref={messagesRef} style={{ flex: 1, overflowY: "auto", border: "1px solid #ddd", padding: 12 }}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} onMarkRead={() => markAsRead(m.id)} />
          ))}
          {typingUsers.length > 0 && <p style={{ fontStyle: "italic" }}>{typingUsers.join(", ")} typing...</p>}
        </div>

        <div style={{ marginTop: 12 }}>
          <MessageInput />
        </div>
      </div>
    </div>
  );
}
