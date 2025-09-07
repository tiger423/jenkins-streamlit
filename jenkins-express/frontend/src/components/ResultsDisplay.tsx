import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
} from '@mui/material';
import { ExpandMore, Edit, Save } from '@mui/icons-material';
import { JenkinsJob, JobDetail, ServerInfo, DebugInfo } from '../types';
import axios from 'axios';

interface ResultsDisplayProps {
  results: any;
  loading: boolean;
  error: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  loading,
  error,
}) => {
  const [editingPipeline, setEditingPipeline] = useState(false);
  const [pipelineScript, setPipelineScript] = useState('');
  const [originalConfigXml, setOriginalConfigXml] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  const extractPipelineScript = (configXml: string): string => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(configXml, 'text/xml');
      const scriptElements = xmlDoc.getElementsByTagName('script');
      if (scriptElements.length > 0) {
        return scriptElements[0].textContent || '';
      }
      return '';
    } catch (error) {
      console.error('Error parsing XML:', error);
      return '';
    }
  };

  const updatePipelineInXml = (configXml: string, newScript: string): string => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(configXml, 'text/xml');
      const scriptElements = xmlDoc.getElementsByTagName('script');
      if (scriptElements.length > 0) {
        scriptElements[0].textContent = newScript;
        const serializer = new XMLSerializer();
        return serializer.serializeToString(xmlDoc);
      }
      return configXml;
    } catch (error) {
      console.error('Error updating XML:', error);
      return configXml;
    }
  };

  const handleUpdatePipeline = async (jobName: string) => {
    setUpdateLoading(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const updatedXml = updatePipelineInXml(originalConfigXml, pipelineScript);
      const response = await axios.put(`${API_BASE_URL}/api/jobs/${jobName}/config`, {
        configXml: updatedXml
      });

      if (response.data.success) {
        setUpdateSuccess('Pipeline updated successfully!');
        setEditingPipeline(false);
      } else {
        setUpdateError(response.data.message || 'Failed to update pipeline');
      }
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || 'Failed to update pipeline');
    } finally {
      setUpdateLoading(false);
    }
  };
  const renderResults = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!results) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
          No results to display. Connect to Jenkins and run an operation.
        </Typography>
      );
    }

    if (typeof results === 'string') {
      return (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {results}
        </Typography>
      );
    }

    if (Array.isArray(results)) {
      return renderJobsList(results);
    }

    if (results.name && results.color) {
      return renderJobDetail(results);
    }

    if (results.version && results.user_info) {
      return renderServerInfo(results);
    }

    if (results.headers && results.json_keys) {
      return renderDebugInfo(results);
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Raw Data
        </Typography>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </Box>
    );
  };

  const renderJobsList = (jobs: JenkinsJob[]) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Jenkins Jobs ({jobs.length})
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Job Name</TableCell>
              <TableCell>Buildable</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.name}>
                <TableCell>
                  <Chip
                    size="small"
                    label={getJobStatusText(job.color)}
                    sx={{
                      backgroundColor: getJobStatusColor(job.color),
                      color: 'white',
                      fontSize: '0.75rem',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {job.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={job.buildable ? 'Yes' : 'No'}
                    color={job.buildable ? 'success' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {job.description || 'No description'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderJobDetail = (job: JobDetail) => {
    React.useEffect(() => {
      if (job.configXml) {
        const script = extractPipelineScript(job.configXml);
        setPipelineScript(script);
        setOriginalConfigXml(job.configXml);
      }
    }, [job.configXml]);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Job Details: {job.name}
        </Typography>
        
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Basic Information
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="medium">Status:</Typography>
                  <Chip
                    size="small"
                    label={getJobStatusText(job.color)}
                    sx={{
                      backgroundColor: getJobStatusColor(job.color),
                      color: 'white',
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="medium">Buildable:</Typography>
                  <Chip
                    size="small"
                    label={job.buildable ? 'Yes' : 'No'}
                    color={job.buildable ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
                {job.description && (
                  <Box>
                    <Typography variant="body2" fontWeight="medium">Description:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {job.description}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {job.configXml && pipelineScript && (
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Pipeline Script
                  </Typography>
                  <Button
                    startIcon={editingPipeline ? <Save /> : <Edit />}
                    onClick={() => {
                      if (editingPipeline) {
                        handleUpdatePipeline(job.name);
                      } else {
                        setEditingPipeline(true);
                        setUpdateError('');
                        setUpdateSuccess('');
                      }
                    }}
                    disabled={updateLoading}
                    variant={editingPipeline ? 'contained' : 'outlined'}
                    size="small"
                  >
                    {editingPipeline ? (updateLoading ? 'Updating...' : 'Update') : 'Edit'}
                  </Button>
                </Box>
                
                {updateError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {updateError}
                  </Alert>
                )}
                
                {updateSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {updateSuccess}
                  </Alert>
                )}

                <TextField
                  multiline
                  rows={12}
                  fullWidth
                  value={pipelineScript}
                  onChange={(e) => setPipelineScript(e.target.value)}
                  disabled={!editingPipeline}
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    },
                  }}
                />
                
                {editingPipeline && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditingPipeline(false);
                        setPipelineScript(extractPipelineScript(originalConfigXml));
                        setUpdateError('');
                        setUpdateSuccess('');
                      }}
                      disabled={updateLoading}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {job.lastBuild && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Last Build
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="medium">Build #:</Typography>
                    <Typography variant="body2">{job.lastBuild.number}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="medium">Result:</Typography>
                    <Chip
                      size="small"
                      label={job.lastBuild.result || 'Unknown'}
                      color={getBuildResultColor(job.lastBuild.result)}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="medium">Timestamp:</Typography>
                    <Typography variant="body2">
                      {new Date(job.lastBuild.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}

          {job.builds && job.builds.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  Build History ({job.builds.length} builds)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Build #</TableCell>
                        <TableCell>Result</TableCell>
                        <TableCell>Timestamp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {job.builds.slice(0, 10).map((build) => (
                        <TableRow key={build.number}>
                          <TableCell>{build.number}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={build.result || 'Unknown'}
                              color={getBuildResultColor(build.result)}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(build.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )}
        </Stack>
      </Box>
    );
  };

  const renderServerInfo = (info: ServerInfo) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Jenkins Server Information
      </Typography>
      
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Server Details
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium">Version:</Typography>
                <Typography variant="body2">{info.version}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium">Node Name:</Typography>
                <Typography variant="body2">{info.node_name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium">Current User:</Typography>
                <Typography variant="body2">{info.user_info} ({info.user_id})</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium">Plugin Count:</Typography>
                <Typography variant="body2">{info.plugin_count}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Raw Server Data</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
              {JSON.stringify(info.server_data, null, 2)}
            </pre>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );

  const renderDebugInfo = (debug: DebugInfo) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Debug Information
      </Typography>
      
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Version Information
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium">Header Version:</Typography>
                <Typography variant="body2">{debug.header_version || 'Not found'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="medium">JSON Version:</Typography>
                <Typography variant="body2">{debug.json_version}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              JSON Keys ({debug.json_keys.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {debug.json_keys.map((key) => (
                <Chip key={key} label={key} size="small" variant="outlined" />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Sample Data</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
              {JSON.stringify(debug.sample_data, null, 2)}
            </pre>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Response Headers</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
              {JSON.stringify(debug.headers, null, 2)}
            </pre>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Results
        </Typography>
        {renderResults()}
      </CardContent>
    </Card>
  );
};

const getJobStatusColor = (color: string): string => {
  switch (color) {
    case 'blue':
      return '#4caf50';
    case 'red':
      return '#f44336';
    case 'yellow':
      return '#ff9800';
    case 'grey':
      return '#9e9e9e';
    case 'aborted':
      return '#607d8b';
    case 'notbuilt':
      return '#e0e0e0';
    default:
      return '#2196f3';
  }
};

const getJobStatusText = (color: string): string => {
  switch (color) {
    case 'blue':
      return 'SUCCESS';
    case 'red':
      return 'FAILED';
    case 'yellow':
      return 'UNSTABLE';
    case 'grey':
      return 'DISABLED';
    case 'aborted':
      return 'ABORTED';
    case 'notbuilt':
      return 'NOT BUILT';
    default:
      return 'BUILDING';
  }
};

const getBuildResultColor = (result: string): 'success' | 'error' | 'warning' | 'default' => {
  switch (result?.toUpperCase()) {
    case 'SUCCESS':
      return 'success';
    case 'FAILURE':
    case 'FAILED':
      return 'error';
    case 'UNSTABLE':
      return 'warning';
    default:
      return 'default';
  }
};

export default ResultsDisplay;
