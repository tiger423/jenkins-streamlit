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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility, VisibilityOff, Link, Person, Key, AccountCircle } from '@mui/icons-material';
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
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  const handleConnect = () => {
    if (url && username && password) {
      onConnect(url, username, password);
      setAccountDialogOpen(false);
    }
  };

  const handleAccountDialogOpen = () => {
    setAccountDialogOpen(true);
  };

  const handleAccountDialogClose = () => {
    setAccountDialogOpen(false);
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
          
          <Stack direction="row" spacing={1}>
            {!connectionStatus.connected ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<AccountCircle />}
                  onClick={handleAccountDialogOpen}
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  Account
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConnect}
                  disabled={loading || !url || !username || !password}
                  sx={{ flex: 2 }}
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </Button>
              </>
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

        <Dialog open={accountDialogOpen} onClose={handleAccountDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Jenkins Account Credentials</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                fullWidth
                size="small"
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
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAccountDialogClose}>Cancel</Button>
            <Button 
              onClick={handleConnect} 
              variant="contained"
              disabled={!username || !password}
            >
              Save & Connect
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ConnectionPanel;
