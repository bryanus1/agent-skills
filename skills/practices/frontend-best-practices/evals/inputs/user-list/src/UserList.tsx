import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  active: boolean;
}

export function UserList({ query, onOpen }: { query: string; onOpen: (id: string) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [visible, setVisible] = useState<User[]>([]);

  useEffect(() => {
    fetch(`/api/users?q=${query}`)
      .then((r) => r.json())
      .then(setUsers);
  }, [query]);

  useEffect(() => {
    setVisible(users.filter((u) => u.active));
  }, [users]);

  return (
    <ul>
      {visible.map((u, i) => (
        <li key={i} onClick={() => onOpen(u.id)} style={{ cursor: 'pointer' }}>
          <img src={u.avatar} />
          <strong>{u.name}</strong>
          <div dangerouslySetInnerHTML={{ __html: u.bio }} />
        </li>
      ))}
    </ul>
  );
}
