'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);

  const handleSubmit = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input,
        }),
      });

      const data = await res.json();
      console.log('Response:', data);
      setResponse(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <main>
      <h1>COGNIS PROTON</h1>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your input"
      />
      <button onClick={handleSubmit}>Submit</button>
    </main>
  );
}
