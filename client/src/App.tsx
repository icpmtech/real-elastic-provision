import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Search, Database, Activity, Box } from 'lucide-react'
import './App.css'

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
}

interface Hit {
  _id: string;
  _source: Product;
  highlight?: {
    [key: string]: string[];
  };
}

interface Aggregations {
  categories: { key: string; docCount: number }[];
  priceStats: { min: number; max: number; avg: number; count: number; sum: number };
}

interface SearchResponse {
  hits: Hit[];
  aggregations: Aggregations;
}

function App() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [results, setResults] = useState<Hit[]>([])
  const [aggs, setAggs] = useState<Aggregations | null>(null)
  const [loading, setLoading] = useState(false)

  const search = async (q: string) => {
    setLoading(true)
    try {
      const response = await axios.get<SearchResponse>(`http://localhost:5000/search?query=${q}`)
      console.log('Search response:', response.data);
      setResults(response.data.hits || [])
      setAggs(response.data.aggregations)
      setSuggestions([])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
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

  // Initial search to populate dashboard
  useEffect(() => {
    search('')
  }, [])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Activity size={24} />
          <span>NEXUS ANALYTICS</span>
        </div>
        <div className="search-container">
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search(query)}
              placeholder="Search intelligence database..."
            />
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
        </div>
      </header>

      <main className="main-content">
        <div className="dashboard-grid">
          {/* Left Column: Stats & Charts */}
          <div className="stats-column">
            <div className="card stats-card">
              <h3><Database size={16} /> Data Overview</h3>
              <div className="stat-row">
                <span>Total Records</span>
                <span className="stat-value">{aggs?.priceStats?.count || 0}</span>
              </div>
              <div className="stat-row">
                <span>Avg Price</span>
                <span className="stat-value">${aggs?.priceStats?.avg?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div className="card chart-card">
              <h3>Category Distribution</h3>
              <div className="chart-container">
                {aggs?.categories && (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={aggs.categories}>
                      <XAxis dataKey="key" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="docCount" radius={[4, 4, 0, 0]}>
                        {aggs.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Search Results */}
          <div className="results-column">
            <div className="results-header">
              <h2>Intelligence Results</h2>
              <span className="result-count">{results.length} items found</span>
            </div>
            
            <div className="results-list">
              {loading ? (
                <div className="loading">Analyzing data streams...</div>
              ) : (
                results.map((hit, i) => (
                  <div key={i} className="result-card">
                    <div className="result-icon">
                      <Box size={20} />
                    </div>
                    <div className="result-content">
                      <div className="result-top">
                        <h3 dangerouslySetInnerHTML={{ __html: hit.highlight?.name ? hit.highlight.name[0] : hit._source.name }} />
                        <span className="category-tag">{hit._source.category}</span>
                      </div>
                      <p dangerouslySetInnerHTML={{ __html: hit.highlight?.description ? hit.highlight.description[0] : hit._source.description }} />
                      <div className="result-meta">
                        <span className="price-tag">${hit._source.price}</span>
                        <span className="id-tag">ID: {hit._source.id ? hit._source.id.substring(0, 8) : 'N/A'}...</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
