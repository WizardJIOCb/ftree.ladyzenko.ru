import { BrowserRouter } from 'react-router-dom'

import { MainRoutes } from './MainRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <MainRoutes />
    </BrowserRouter>
  )
}
