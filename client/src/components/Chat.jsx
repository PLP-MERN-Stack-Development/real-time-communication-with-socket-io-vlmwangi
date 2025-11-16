import { useEffect, useState } from "react";
import socket from "../socket/socket";
import UserList from "./UserList";
import MessageInput from "./MessageInput";
import PrivateChat from "./PrivateChat";

export default function Chat({ username }) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);

  useEffect(() => {
    socket.emit("user_join", username);

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user_list", (list) => {
      setOnlineUsers(list);
    });

    socket.on("typing_users", (list) => {
      setTypingUsers(list);
    });

    socket.on("private_message", (msg) => {
      setPrivateMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_list");
      socket.off("typing_users");
      socket.off("private_message");
    };
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar users */}
      <UserList
        users={onlineUsers}
        currentUser={socket.id}
        selectUser={setSelectedUser}
      />

      {/* Main chat area */}
      <div style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column" }}>
        {selectedUser ? (
          <PrivateChat
            selectedUser={selectedUser}
            messages={privateMessages}
            username={username}
          />
        ) : (
          <>
            <h2>Global Chat</h2>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid #ccc",
                padding: "1rem",
                marginBottom: "1rem",
              }}>
              {messages.map((msg) => (
                <p key={msg.id}>
                  <strong>{msg.sender}: </strong>
                  {msg.message}
                </p>
              ))}

              {typingUsers.length > 0 && (
                <p style={{ fontStyle: "italic" }}>
                  {typingUsers.join(", ")} typing...
                </p>
              )}
            </div>

            <MessageInput />
          </>
        )}
      </div>
    </div>
  );
}
