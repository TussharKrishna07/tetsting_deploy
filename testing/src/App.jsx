import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [backendMessage, setBackendMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/hello')
      .then(r => { if(!r.ok) throw new Error('API error ' + r.status); return r.json(); })
      .then(data => setBackendMessage(`${data.message} (UTC: ${data.timestamp})`))
      .catch(e => setError(e.message))
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
        <div style={{marginTop: '1rem'}}>
          <strong>Backend status:</strong><br />
          {error && <span style={{color: 'red'}}>Error: {error}</span>}
          {!error && !backendMessage && <span>Loading message...</span>}
          {!error && backendMessage && <span>{backendMessage}</span>}
        </div>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
