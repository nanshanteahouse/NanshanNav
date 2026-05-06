import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { HomePage } from './pages/HomePage';

const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)] text-sm">加载中...</div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Suspense>
  );
}

export default App
