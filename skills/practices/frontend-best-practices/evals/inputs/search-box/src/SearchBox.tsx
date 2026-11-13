import { useId, useState } from 'react';

export function SearchBox({ onSearch }: { onSearch: (term: string) => void }) {
  const inputId = useId();
  const [term, setTerm] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(term.trim());
  }

  return (
    <form role="search" onSubmit={handleSubmit}>
      <label htmlFor={inputId}>Buscar</label>
      <input
        id={inputId}
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        autoComplete="off"
      />
      <button type="submit">Buscar</button>
    </form>
  );
}
