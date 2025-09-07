const axios = require('axios');

class JenkinsClient {
    constructor() {
        this.session = null;
        this.baseUrl = null;
        this.authHeader = null;
    }

    createAuthHeader(username, password) {
        const credentials = `${username}:${password}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');
        return { Authorization: `Basic ${encodedCredentials}` };
    }

    async makeRequest(endpoint, returnHeaders = false) {
        if (!this.session || !this.baseUrl) {
            const error = "Not connected to Jenkins server";
            return returnHeaders ? [null, error, {}] : [null, error];
        }

        const url = `${this.baseUrl.replace(/\/$/, '')}${endpoint}`;
        
        try {
            const response = await axios.get(url, {
                headers: this.authHeader,
                timeout: 10000,
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
            });

            if (returnHeaders) {
                return [response.data, null, response.headers];
            } else {
                return [response.data, null];
            }
        } catch (error) {
            let errorMsg;
            
            if (error.response) {
                const status = error.response.status;
                if (status === 401) {
                    errorMsg = "Authentication failed - check username/password";
                } else if (status === 403) {
                    errorMsg = "Access denied - insufficient permissions";
                } else if (status === 404) {
                    errorMsg = "Jenkins server not found or endpoint unavailable";
                } else {
                    errorMsg = `HTTP ${status}: ${error.message}`;
                }
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                errorMsg = "Connection failed - check server URL and network";
            } else if (error.code === 'ETIMEDOUT') {
                errorMsg = "Request timeout - Jenkins server may be slow";
            } else {
                errorMsg = `Request error: ${error.message}`;
            }

            if (returnHeaders) {
                return [null, errorMsg, error.response?.headers || {}];
            } else {
                return [null, errorMsg];
            }
        }
    }

    getVersionFromHeaders(headers) {
        const versionHeaders = ['x-jenkins', 'x-jenkins-version', 'jenkins-version', 'server'];
        
        for (const header of versionHeaders) {
            const headerKey = Object.keys(headers).find(key => 
                key.toLowerCase() === header.toLowerCase()
            );
            
            if (headerKey && headers[headerKey]) {
                const value = headers[headerKey];
                if (value.includes('Jenkins') && value.includes('/')) {
                    return value.split('/').pop();
                } else if (header.toLowerCase() === 'server' && value.includes('Jenkins')) {
                    const parts = value.split('/');
                    for (const part of parts) {
                        if (part && /^\d/.test(part)) {
                            return part;
                        }
                    }
                } else {
                    return value;
                }
            }
        }
        return null;
    }

    async connect(url, username, password) {
        try {
            this.authHeader = this.createAuthHeader(username, password);
            this.baseUrl = url;
            this.session = true; // Simple flag to indicate connection

            const [data, error, headers] = await this.makeRequest("/api/json", true);
            if (error) {
                this.disconnect();
                return [false, `Connection failed: ${error}`];
            }

            let version = this.getVersionFromHeaders(headers);
            if (!version) {
                version = data.version || 'Unknown';
            }

            return [true, `Connected successfully to Jenkins v${version}`];
        } catch (error) {
            this.disconnect();
            return [false, `Connection Error: ${error.message}`];
        }
    }

    disconnect() {
        this.session = null;
        this.baseUrl = null;
        this.authHeader = null;
    }

    isConnected() {
        return this.session !== null && this.baseUrl !== null;
    }

    async testConnection() {
        try {
            const [serverData, serverError, headers] = await this.makeRequest("/api/json", true);
            if (serverError) {
                return [false, `❌ Connection failed: ${serverError}`];
            }

            const [userData, userError] = await this.makeRequest("/me/api/json");
            if (userError) {
                return [false, `❌ User info failed: ${userError}`];
            }

            let version = this.getVersionFromHeaders(headers);
            if (!version) {
                version = serverData.version || 'Unknown';
            }

            const userName = userData.fullName || 'Unknown';
            return [true, `✅ Connected as '${userName}' to Jenkins v${version}`];
        } catch (error) {
            return [false, `❌ Connection test failed: ${error.message}`];
        }
    }

    async getJobs(viewName = null) {
        try {
            let endpoint;
            if (viewName && viewName !== 'All' && viewName.trim() !== '') {
                const encodedViewName = encodeURIComponent(viewName);
                endpoint = `/view/${encodedViewName}/api/json?tree=jobs[name,color,url,buildable,description]`;
            } else {
                endpoint = "/api/json?tree=jobs[name,color,url,buildable,description]";
            }
            
            const [data, error] = await this.makeRequest(endpoint);
            if (error) {
                return [null, `Error listing jobs: ${error}`];
            }

            const jobs = data.jobs || [];
            return [jobs, null];
        } catch (error) {
            return [null, `Error listing jobs: ${error.message}`];
        }
    }

    async getJobDetail(jobName) {
        try {
            const endpoint = `/job/${jobName}/api/json?tree=name,description,buildable,color,url,lastBuild[number,url,result,timestamp],builds[number,url,result,timestamp]`;
            const [data, error] = await this.makeRequest(endpoint);
            if (error) {
                return [null, `Error getting job details: ${error}`];
            }

            return [data, null];
        } catch (error) {
            return [null, `Error getting job details: ${error.message}`];
        }
    }

    async getJobConfig(jobName) {
        try {
            const url = `${this.baseUrl.replace(/\/$/, '')}/job/${jobName}/config.xml`;
            const response = await axios.get(url, {
                headers: this.authHeader,
                timeout: 10000,
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
            });
            return [response.data, null];
        } catch (error) {
            return [null, `Error getting job config: ${error.message}`];
        }
    }

    async updateJobConfig(jobName, configXml) {
        try {
            const url = `${this.baseUrl.replace(/\/$/, '')}/job/${jobName}/config.xml`;
            const response = await axios.post(url, configXml, {
                headers: {
                    ...this.authHeader,
                    'Content-Type': 'application/xml'
                },
                timeout: 10000,
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
            });
            return [true, 'Job configuration updated successfully'];
        } catch (error) {
            return [false, `Error updating job config: ${error.message}`];
        }
    }

    async getServerInfo() {
        try {
            const [serverData, serverError, headers] = await this.makeRequest("/api/json", true);
            if (serverError) {
                return [null, `Error getting server info: ${serverError}`];
            }

            const [userData, userError] = await this.makeRequest("/me/api/json");
            let userInfo = "Unknown";
            let userId = "Unknown";
            if (!userError && userData) {
                userInfo = userData.fullName || 'Unknown';
                userId = userData.id || 'Unknown';
            }

            const [pluginData, pluginError] = await this.makeRequest("/pluginManager/api/json?depth=1");
            let pluginCount = "Unknown";
            if (!pluginError && pluginData) {
                const plugins = pluginData.plugins || [];
                pluginCount = plugins.length;
            }

            let version = this.getVersionFromHeaders(headers);
            if (!version) {
                version = serverData.version || 'Unknown';
            }

            const nodeName = serverData.nodeName || 'Unknown';

            const info = {
                version,
                node_name: nodeName,
                user_info: userInfo,
                user_id: userId,
                plugin_count: pluginCount,
                headers,
                server_data: serverData
            };

            return [info, null];
        } catch (error) {
            return [null, `Error getting server info: ${error.message}`];
        }
    }

    async getDebugInfo() {
        try {
            const [data, error, headers] = await this.makeRequest("/api/json", true);
            
            if (error) {
                return [null, `Debug Error: ${error}`];
            }

            const debugInfo = {
                headers,
                json_keys: typeof data === 'object' && data !== null ? Object.keys(data) : [],
                header_version: this.getVersionFromHeaders(headers),
                json_version: data.version || 'Not found in JSON',
                sample_data: {}
            };

            if (typeof data === 'object' && data !== null) {
                const sampleKeys = Object.keys(data).slice(0, 10);
                for (const key of sampleKeys) {
                    const value = String(data[key]).substring(0, 100);
                    debugInfo.sample_data[key] = value;
                }
            }

            return [debugInfo, null];
        } catch (error) {
            return [null, `Debug function error: ${error.message}`];
        }
    }
}

module.exports = new JenkinsClient();
