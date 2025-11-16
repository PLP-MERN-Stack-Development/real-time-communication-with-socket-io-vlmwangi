export default function UserList({ users, currentUser, selectUser }) {
  return (
    <div
      style={{
        width: "220px",
        borderRight: "1px solid #ccc",
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <h3>Online Users</h3>
      {users.map((u) => (
        <p
          key={u.id}
          style={{
            cursor: "pointer",
            color: u.id === currentUser ? "green" : "black",
          }}
          onClick={() => selectUser(u)}
        >
          {u.username}
        </p>
      ))}
    </div>
  );
}
