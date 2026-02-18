import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { KnowledgeBase } from '@/pages/KnowledgeBase';
import { Interface } from '@/pages/Interface';
import { Brain } from '@/pages/Brain';
import { Factory } from '@/pages/Factory';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { UserProvider } from '@/context/UserContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/knowledgeBase" element={<KnowledgeBase />} />
                  <Route path="/interface" element={<Interface />} />
                  <Route path="/brain" element={<Brain />} />
                  <Route path="/factory" element={<Factory />} />
                </Routes>
              </Layout>
            } />
          </Route>
        </Routes>
        <Toaster duration={1000} />
      </UserProvider>
    </Router>
  );
}

export default App;
