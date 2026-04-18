import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MapPage } from '@/pages/Map'
import { Game } from '@/pages/Game'
import { Talk } from '@/pages/Talk'
import { Spellbook } from '@/pages/Spellbook'
import { EchoLayout } from '@/components/EchoLayout'
import '@/lib/i18n'

function App() {
  return (
    <BrowserRouter>
      <EchoLayout>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/island/:islandId/scene/:sceneId" element={<Game />} />
          <Route path="/talk" element={<Talk />} />
          <Route path="/spellbook" element={<Spellbook />} />
        </Routes>
      </EchoLayout>
    </BrowserRouter>
  )
}

export default App
