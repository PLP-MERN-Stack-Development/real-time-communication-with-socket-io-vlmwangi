import React from "react";

export default function MessageBubble({ message, onMarkRead }) {
  const { id, sender, message: text, timestamp, deliveredBy = [], readBy = [], isPrivate } = message;

  // For display, show counts of delivered/read
  const readCount = readBy.length;

  return (
    <div
      style={{
        padding: "8px",
        marginBottom: "8px",
        borderRadius: 6,
        background: isPrivate ? "#fff7e6" : "#f1f1f1",
        cursor: "pointer",
      }}
      onClick={onMarkRead}
      title="Click to mark as read"
    >
      <div style={{ fontSize: 12, color: "#555" }}>
        <strong>{sender}</strong> · <small>{new Date(timestamp).toLocaleTimeString()}</small>
        {isPrivate && <span style={{ marginLeft: 8, fontWeight: 700, color: "#b45" }}> [private] </span>}
      </div>

      <div style={{ marginTop: 4 }}>{text}</div>

      <div style={{ marginTop: 6, fontSize: 12, color: "#666", display: "flex", gap: 12 }}>
        <span>Seen by: {readCount}</span>
      </div>
    </div>
  );
}
