import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MapPage } from '@/pages/Map'
import { Game } from '@/pages/Game'
import '@/lib/i18n'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/island/:islandId/scene/:sceneId" element={<Game />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
