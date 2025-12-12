import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [healthStatus, setHealthStatus] = useState('Verificando...');

  // No Docker Compose, 'backend' será o nome do serviço
  // Em desenvolvimento local, use 'http://localhost:3001'
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        setHealthStatus(data.status === 'healthy' 
          ? `Status: ✅ ${data.status.toUpperCase()} (DB: ${data.database})`
          : `Status: ❌ ${data.status.toUpperCase()} (Erro DB)`
        );
      })
      .catch(err => {
        console.error("Erro ao conectar com o backend:", err);
        setHealthStatus('Status: 🚨 FALHA NA CONEXÃO com o backend.');
      });
  }, []);

  return (
    <div className="App">
      <h1>Monitoramento API P2</h1>
      <p>Tentando acessar o Health Check da API Node.js...</p>
      <div className={healthStatus.includes('✅') ? 'status-ok' : 'status-fail'}>
        {healthStatus}
      </div>
      <p>Frontend (React/Vite) carregado com sucesso.</p>
    </div>
  );
}

export default App;