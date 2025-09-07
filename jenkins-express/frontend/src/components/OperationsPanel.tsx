import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  List,
  Info,
  BugReport,
  Work,
} from '@mui/icons-material';
import { JenkinsJob } from '../types';

interface OperationsPanelProps {
  connected: boolean;
  loading: boolean;
  jobs: JenkinsJob[];
  selectedJob: string;
  onSelectedJobChange: (jobName: string) => void;
  onTestConnection: () => void;
  onListJobs: () => void;
  onGetJobDetails: (jobName: string) => void;
  onGetServerInfo: () => void;
  onGetDebugInfo: () => void;
}

const OperationsPanel: React.FC<OperationsPanelProps> = ({
  connected,
  loading,
  jobs,
  selectedJob,
  onSelectedJobChange,
  onTestConnection,
  onListJobs,
  onGetJobDetails,
  onGetServerInfo,
  onGetDebugInfo,
}) => {
  const handleJobDetailsClick = () => {
    if (selectedJob) {
      onGetJobDetails(selectedJob);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Operations
        </Typography>
        
        <Stack spacing={2}>
          <Button
            variant="outlined"
            startIcon={<CheckCircle />}
            onClick={onTestConnection}
            disabled={!connected || loading}
            fullWidth
          >
            Test Connection
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<List />}
            onClick={onListJobs}
            disabled={!connected || loading}
            fullWidth
          >
            List All Jobs
          </Button>
          
          <Divider />
          
          <Typography variant="subtitle2" color="text.secondary">
            Job Details
          </Typography>
          
          <FormControl fullWidth size="small" disabled={!connected || loading || jobs.length === 0}>
            <InputLabel>Select Job</InputLabel>
            <Select
              value={selectedJob}
              label="Select Job"
              onChange={(e) => onSelectedJobChange(e.target.value)}
            >
              {jobs.map((job) => (
                <MenuItem key={job.name} value={job.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: getJobStatusColor(job.color),
                      }}
                    />
                    {job.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<Work />}
            onClick={handleJobDetailsClick}
            disabled={!connected || loading || !selectedJob}
            fullWidth
          >
            Get Job Details
          </Button>
          
          <Divider />
          
          <Typography variant="subtitle2" color="text.secondary">
            Server Information
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<Info />}
            onClick={onGetServerInfo}
            disabled={!connected || loading}
            fullWidth
          >
            Server Info
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<BugReport />}
            onClick={onGetDebugInfo}
            disabled={!connected || loading}
            fullWidth
          >
            Debug Info
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const getJobStatusColor = (color: string): string => {
  switch (color) {
    case 'blue':
      return '#4caf50'; // green for success
    case 'red':
      return '#f44336'; // red for failed
    case 'yellow':
      return '#ff9800'; // orange for unstable
    case 'grey':
      return '#9e9e9e'; // grey for disabled
    case 'aborted':
      return '#607d8b'; // blue-grey for aborted
    case 'notbuilt':
      return '#e0e0e0'; // light grey for not built
    default:
      return '#2196f3'; // blue for unknown/building
  }
};

export default OperationsPanel;
