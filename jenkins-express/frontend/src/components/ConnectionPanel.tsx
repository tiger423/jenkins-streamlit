import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Link, Person, Key } from '@mui/icons-material';
import { ConnectionStatus } from '../types';

interface ConnectionPanelProps {
  connectionStatus: ConnectionStatus;
  onConnect: (url: string, username: string, password: string) => void;
  onDisconnect: () => void;
  loading: boolean;
}

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  connectionStatus,
  onConnect,
  onDisconnect,
  loading,
}) => {
  const [url, setUrl] = useState('http://172.18.3.50:8080');
  const [username, setUsername] = useState('ve');
  const [password, setPassword] = useState('ve');
  const [showPassword, setShowPassword] = useState(false);

  const handleConnect = () => {
    if (url && username && password) {
      onConnect(url, username, password);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Jenkins Connection
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Chip
            label={connectionStatus.connected ? 'Connected' : 'Disconnected'}
            color={connectionStatus.connected ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Jenkins Server URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            size="small"
            disabled={connectionStatus.connected || loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Link fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            size="small"
            disabled={connectionStatus.connected || loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            size="small"
            disabled={connectionStatus.connected || loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Key fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Stack direction="row" spacing={1}>
            {!connectionStatus.connected ? (
              <Button
                variant="contained"
                onClick={handleConnect}
                disabled={loading || !url || !username || !password}
                fullWidth
              >
                {loading ? 'Connecting...' : 'Connect'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="secondary"
                onClick={onDisconnect}
                disabled={loading}
                fullWidth
              >
                Disconnect
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ConnectionPanel;
