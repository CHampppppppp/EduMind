import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { KnowledgeBase } from '@/pages/KnowledgeBase';
import { Interface } from '@/pages/Interface';
import { Brain } from '@/pages/Brain';
import { Factory } from '@/pages/Factory';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/chat" element={<Interface />} />
          <Route path="/analysis" element={<Brain />} />
          <Route path="/generate" element={<Factory />} />
        </Routes>
      </Layout>
      <Toaster duration={1000} />
    </Router>
  );
}

export default App;
