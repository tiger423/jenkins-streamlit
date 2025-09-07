import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Drawer, AppBar, Toolbar, Typography, Container } from '@mui/material';
import ConnectionPanel from './components/ConnectionPanel';
import OperationsPanel from './components/OperationsPanel';
import ResultsDisplay from './components/ResultsDisplay';
import { ConnectionStatus, JenkinsJob } from './types';
import axios from 'axios';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const DRAWER_WIDTH = 320;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

function App() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    message: 'Not connected'
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [jobs, setJobs] = useState<JenkinsJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [error, setError] = useState<string>('');

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await apiClient.get('/api/connection-status');
      setConnectionStatus(response.data);
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleConnect = async (url: string, username: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/connect', { url, username, password });
      if (response.data.success) {
        setConnectionStatus({ connected: true, message: response.data.message });
        setResults(`✅ ${response.data.message}`);
      } else {
        setError(response.data.message);
        setResults(`❌ ${response.data.message}`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Connection failed';
      setError(errorMsg);
      setResults(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await apiClient.post('/api/disconnect');
      setConnectionStatus({ connected: false, message: 'Not connected' });
      setResults('Disconnected from Jenkins');
      setJobs([]);
      setSelectedJob('');
      setError('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Disconnect failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleListJobs = async (view?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = view && view !== 'All' && view.trim() !== '' ? { view } : {};
      const response = await apiClient.get('/api/jobs', { params });
      if (response.data.success) {
        setJobs(response.data.data);
        setResults(response.data.data);
      } else {
        setError(response.data.message);
        setResults(`❌ ${response.data.message}`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to list jobs';
      setError(errorMsg);
      setResults(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetJobDetails = async (jobName: string) => {
    if (!jobName) return;
    
    setLoading(true);
    setError('');
    try {
      const [jobResponse, configResponse] = await Promise.all([
        apiClient.get(`/api/jobs/${encodeURIComponent(jobName)}`),
        apiClient.get(`/api/jobs/${encodeURIComponent(jobName)}/config`)
      ]);
      
      if (jobResponse.data.success) {
        const jobDetail = jobResponse.data.data;
        if (configResponse.data.success) {
          jobDetail.configXml = configResponse.data.data;
        }
        setResults(jobDetail);
      } else {
        setError(jobResponse.data.message);
        setResults(`❌ ${jobResponse.data.message}`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to get job details';
      setError(errorMsg);
      setResults(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetServerInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/api/server-info');
      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError(response.data.message);
        setResults(`❌ ${response.data.message}`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to get server info';
      setError(errorMsg);
      setResults(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDebugInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/api/debug-info');
      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError(response.data.message);
        setResults(`❌ ${response.data.message}`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to get debug info';
      setError(errorMsg);
      setResults(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Jenkins Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', p: 2 }}>
            <ConnectionPanel
              connectionStatus={connectionStatus}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              loading={loading}
            />
            
            <OperationsPanel
              connected={connectionStatus.connected}
              loading={loading}
              jobs={jobs}
              selectedJob={selectedJob}
              onSelectedJobChange={setSelectedJob}
              onListJobs={handleListJobs}
              onGetJobDetails={handleGetJobDetails}
              onGetServerInfo={handleGetServerInfo}
              onGetDebugInfo={handleGetDebugInfo}
            />
          </Box>
        </Drawer>
        
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth={false}>
            <ResultsDisplay
              results={results}
              loading={loading}
              error={error}
            />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
