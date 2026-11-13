import { useEffect, useState } from 'react';

export default function UserList(props: any) {
  const [data, setData] = useState<any>([]);
  const [l, setL] = useState(false);
  const [f, setF] = useState('');
  const [filtered, setFiltered] = useState<any>([]);

  useEffect(() => {
    setL(true);
    fetch('/api/users?team=' + props.team)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setL(false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setFiltered(data.filter((u: any) => u.name.toLowerCase().includes(f.toLowerCase()) && (props.showInactive ? true : u.status === 1)));
  }, [data, f]);

  function handle(u: any, x: boolean) {
    if (x) {
      if (u.role !== 'admin') {
        if (window.confirm('Delete ' + u.name + '?')) {
          fetch('/api/users/' + u.id, { method: 'DELETE' }).then(() => setData(data.filter((d: any) => d.id !== u.id)));
        }
      }
    } else {
      props.onSelect(u);
    }
  }

  return (
    <div>
      <input value={f} onChange={(e) => setF(e.target.value)} />
      {l ? <p>Loading...</p> : filtered.length === 0 ? <p>No users</p> : (
        <ul>
          {filtered.map((u: any) => (
            <li key={u.id} onClick={() => handle(u, false)} style={{ color: u.status === 1 ? 'green' : u.status === 2 ? 'orange' : 'gray' }}>
              {u.name} - {u.email}
              <button onClick={() => handle(u, true)}>x</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
