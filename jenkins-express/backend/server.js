const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const jenkinsClient = require('./jenkinsClient');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.post('/api/connect', async (req, res) => {
    try {
        const { url, username, password } = req.body;
        
        if (!url || !username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: url, username, password' 
            });
        }

        const [success, message] = await jenkinsClient.connect(url, username, password);
        res.json({ success, message });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: `Server error: ${error.message}` 
        });
    }
});

app.post('/api/disconnect', (req, res) => {
    try {
        jenkinsClient.disconnect();
        res.json({ success: true, message: 'Disconnected from Jenkins' });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: `Server error: ${error.message}` 
        });
    }
});

app.get('/api/test-connection', async (req, res) => {
    try {
        if (!jenkinsClient.isConnected()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Not connected to Jenkins server' 
            });
        }

        const [success, result] = await jenkinsClient.testConnection();
        res.json({ success, data: result });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: `Server error: ${error.message}` 
        });
    }
});

app.get('/api/jobs', async (req, res) => {
    try {
        if (!jenkinsClient.isConnected()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Not connected to Jenkins server' 
            });
        }

        const [jobs, error] = await jenkinsClient.getJobs();
        if (error) {
            return res.status(500).json({ success: false, message: error });
        }

        res.json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: `Server error: ${error.message}` 
        });
    }
});

app.get('/api/jobs/:jobName', async (req, res) => {
    try {
        if (!jenkinsClient.isConnected()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Not connected to Jenkins server' 
            });
        }

        const { jobName } = req.params;
        const [jobDetail, error] = await jenkinsClient.getJobDetail(jobName);
        if (error) {
            return res.status(500).json({ success: false, message: error });
        }

        res.json({ success: true, data: jobDetail });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: `Server error: ${error.message}` 
        });
    }
});

app.get('/api/jobs/:jobName/config', async (req, res) => {
    try {
        if (!jenkinsClient.isConnected()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Not connected to Jenkins server' 
            });
        }

        const { jobName } = req.params;
        const [config, error] = await jenkinsClient.getJobConfig(jobName);
        if (error) {
            return res.status(500).json({ success: false, message: error });
        }

        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: `Server error: ${error.message}` 
        });
    }
});

app.get('/api/server-info', async (req, res) => {
    try {
        if (!jenkinsClient.isConnected()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Not connected to Jenkins server' 
            });
        }

        const [info, error] = await jenkinsClient.getServerInfo();
        if (error) {
            return res.status(500).json({ success: false, message: error });
        }

        res.json({ success: true, data: info });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: `Server error: ${error.message}` 
        });
    }
});

app.get('/api/debug-info', async (req, res) => {
    try {
        if (!jenkinsClient.isConnected()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Not connected to Jenkins server' 
            });
        }

        const [debugInfo, error] = await jenkinsClient.getDebugInfo();
        if (error) {
            return res.status(500).json({ success: false, message: error });
        }

        res.json({ success: true, data: debugInfo });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: `Server error: ${error.message}` 
        });
    }
});

app.get('/api/connection-status', (req, res) => {
    res.json({ 
        connected: jenkinsClient.isConnected(),
        message: jenkinsClient.isConnected() ? 'Connected' : 'Not connected'
    });
});


app.listen(PORT, () => {
    console.log(`Jenkins Dashboard server running on port ${PORT}`);
});
