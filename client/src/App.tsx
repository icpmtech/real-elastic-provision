import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface Hit {
  source: Product;
  highlight: {
    [key: string]: string[];
  };
}

function App() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [results, setResults] = useState<Hit[]>([])

  const search = async (q: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/search?query=${q}`)
      setResults(response.data)
      setSuggestions([])
    } catch (error) {
      console.error(error)
    }
  }

  const suggest = async (q: string) => {
    if (!q) {
      setSuggestions([])
      return
    }
    try {
      const response = await axios.get(`http://localhost:5000/suggest?query=${q}`)
      setSuggestions(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      suggest(query)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  return (
    <div className="container">
      <h1>Elastic Search</h1>
      <div className="search-box">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search(query)}
          placeholder="Search products..."
        />
        <button onClick={() => search(query)}>Search</button>
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((s, i) => (
              <li key={i} onClick={() => { setQuery(s); search(s); }}>
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="results">
        {results.map((hit, i) => (
          <div key={i} className="result-item">
            <h3 dangerouslySetInnerHTML={{ __html: hit.highlight?.name ? hit.highlight.name[0] : hit.source.name }} />
            <p dangerouslySetInnerHTML={{ __html: hit.highlight?.description ? hit.highlight.description[0] : hit.source.description }} />
            <p className="price">${hit.source.price}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
