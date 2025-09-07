"""
Jenkins API Communication Module
Provides clean API interface for Jenkins operations without UI dependencies.
"""
import requests
import base64
import json
from urllib3.exceptions import InsecureRequestWarning
from typing import Tuple, Dict, List, Optional, Any

# Suppress SSL warnings for demo purposes
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)


class JenkinsAPI:
    """Jenkins API client for communication with Jenkins server"""
    
    def __init__(self):
        self.session = None
        self.base_url = None
        self.auth_header = None
        
    def create_auth_header(self, username: str, password: str) -> Dict[str, str]:
        """Create Basic Auth header for Jenkins"""
        credentials = f"{username}:{password}"
        encoded_credentials = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
        return {"Authorization": f"Basic {encoded_credentials}"}
    
    def make_request(self, endpoint: str, return_headers: bool = False) -> Tuple[Optional[Dict], Optional[str], Optional[Dict]]:
        """Make authenticated request to Jenkins API"""
        if not self.session or not self.base_url:
            error = "Not connected to Jenkins server"
            return (None, error, {}) if return_headers else (None, error)
            
        url = f"{self.base_url.rstrip('/')}{endpoint}"
        try:
            response = self.session.get(url, timeout=10, verify=False)
            response.raise_for_status()
            if return_headers:
                return response.json(), None, dict(response.headers)
            else:
                return response.json(), None
        except requests.exceptions.HTTPError as e:
            if response.status_code == 401:
                error_msg = "Authentication failed - check username/password"
            elif response.status_code == 403:
                error_msg = "Access denied - insufficient permissions"
            elif response.status_code == 404:
                error_msg = "Jenkins server not found or endpoint unavailable"
            else:
                error_msg = f"HTTP {response.status_code}: {str(e)}"
            
            if return_headers:
                return None, error_msg, dict(response.headers) if 'response' in locals() else {}
            else:
                return None, error_msg
        except requests.exceptions.ConnectionError:
            error_msg = "Connection failed - check server URL and network"
            if return_headers:
                return None, error_msg, {}
            else:
                return None, error_msg
        except requests.exceptions.Timeout:
            error_msg = "Request timeout - Jenkins server may be slow"
            if return_headers:
                return None, error_msg, {}
            else:
                return None, error_msg
        except requests.exceptions.RequestException as e:
            error_msg = f"Request error: {str(e)}"
            if return_headers:
                return None, error_msg, {}
            else:
                return None, error_msg
        except json.JSONDecodeError:
            error_msg = "Invalid JSON response from Jenkins"
            if return_headers:
                return None, error_msg, {}
            else:
                return None, error_msg
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            if return_headers:
                return None, error_msg, {}
            else:
                return None, error_msg
    
    def get_version_from_headers(self, headers: Dict[str, str]) -> Optional[str]:
        """Extract Jenkins version from HTTP response headers"""
        version_headers = ['X-Jenkins', 'X-Jenkins-Version', 'Jenkins-Version', 'Server']
        
        for header in version_headers:
            if header in headers:
                value = headers[header]
                # Jenkins version might be in format "Jenkins/2.401.3" or just "2.401.3"
                if 'Jenkins' in value and '/' in value:
                    return value.split('/')[-1]
                elif header == 'Server' and 'Jenkins' in value:
                    # Server header might be "Jenkins/2.401.3" or "Jetty(9.x.x)/Jenkins/2.401.3"
                    parts = value.split('/')
                    for part in parts:
                        if part and part[0].isdigit():
                            return part
                else:
                    return value
        return None
    
    def connect(self, url: str, username: str, password: str) -> Tuple[bool, str]:
        """Create Jenkins session and test connection"""
        try:
            # Create session with authentication
            session = requests.Session()
            auth_header = self.create_auth_header(username, password)
            session.headers.update(auth_header)
            
            # Test connection by getting basic info with headers
            self.session = session
            self.base_url = url
            self.auth_header = auth_header
            
            data, error, headers = self.make_request("/api/json", return_headers=True)
            if error:
                self.disconnect()
                return False, f"Connection failed: {error}"
            
            # Try to get version from headers first, then from JSON
            version = self.get_version_from_headers(headers)
            if not version:
                version = data.get('version', 'Unknown')
            
            return True, f"Connected successfully to Jenkins v{version}"
        except Exception as e:
            self.disconnect()
            return False, f"Connection Error: {str(e)}"
    
    def disconnect(self):
        """Clear connection state"""
        self.session = None
        self.base_url = None
        self.auth_header = None
    
    def is_connected(self) -> bool:
        """Check if currently connected to Jenkins"""
        return self.session is not None and self.base_url is not None
    
    def test_connection(self) -> Tuple[bool, str]:
        """Test basic connectivity to Jenkins"""
        try:
            # Get basic server info with headers
            server_data, server_error, headers = self.make_request("/api/json", return_headers=True)
            if server_error:
                return False, f"❌ Connection failed: {server_error}"
            
            # Get current user info
            user_data, user_error = self.make_request("/me/api/json")
            if user_error:
                return False, f"❌ User info failed: {user_error}"
            
            # Try to get version from headers first, then from JSON
            version = self.get_version_from_headers(headers)
            if not version:
                version = server_data.get('version', 'Unknown')
            
            user_name = user_data.get('fullName', 'Unknown')
            
            return True, f"✅ Connected as '{user_name}' to Jenkins v{version}"
        except Exception as e:
            return False, f"❌ Connection test failed: {str(e)}"
    
    def get_jobs(self) -> Tuple[Optional[List[Dict]], Optional[str]]:
        """Get all jobs from Jenkins with detailed information"""
        try:
            # Get jobs with name, color, and url info
            data, error = self.make_request("/api/json?tree=jobs[name,color,url,buildable,description]")
            if error:
                return None, f"Error listing jobs: {error}"
            
            jobs = data.get('jobs', [])
            return jobs, None
        except Exception as e:
            return None, f"Error listing jobs: {str(e)}"
    
    def get_job_detail(self, job_name: str) -> Tuple[Optional[Dict], Optional[str]]:
        """Get detailed information about a specific job"""
        try:
            # Get detailed job info including pipeline configuration
            endpoint = f"/job/{job_name}/api/json?tree=name,description,buildable,color,url,lastBuild[number,url,result,timestamp],builds[number,url,result,timestamp]"
            data, error = self.make_request(endpoint)
            if error:
                return None, f"Error getting job details: {error}"
            
            return data, None
        except Exception as e:
            return None, f"Error getting job details: {str(e)}"
    
    def get_job_config(self, job_name: str) -> Tuple[Optional[str], Optional[str]]:
        """Get job configuration (pipeline script)"""
        try:
            url = f"{self.base_url.rstrip('/')}/job/{job_name}/config.xml"
            response = self.session.get(url, timeout=10, verify=False)
            response.raise_for_status()
            return response.text, None
        except Exception as e:
            return None, f"Error getting job config: {str(e)}"
    
    def get_server_info(self) -> Tuple[Optional[Dict], Optional[str]]:
        """Get detailed server information"""
        try:
            # Get server info with headers
            server_data, server_error, headers = self.make_request("/api/json", return_headers=True)
            if server_error:
                return None, f"Error getting server info: {server_error}"
            
            # Get user info
            user_data, user_error = self.make_request("/me/api/json")
            user_info = "Unknown"
            user_id = "Unknown"
            if not user_error and user_data:
                user_info = user_data.get('fullName', 'Unknown')
                user_id = user_data.get('id', 'Unknown')
            
            # Get plugin info (optional, may fail due to permissions)
            plugin_data, plugin_error = self.make_request("/pluginManager/api/json?depth=1")
            plugin_count = "Unknown"
            if not plugin_error and plugin_data:
                plugins = plugin_data.get('plugins', [])
                plugin_count = len(plugins)
            
            # Try to get version from headers first, then from JSON
            version = self.get_version_from_headers(headers)
            if not version:
                version = server_data.get('version', 'Unknown')
                
            node_name = server_data.get('nodeName', 'Unknown')
            
            info = {
                'version': version,
                'node_name': node_name,
                'user_info': user_info,
                'user_id': user_id,
                'plugin_count': plugin_count,
                'headers': headers,
                'server_data': server_data
            }
            return info, None
        except Exception as e:
            return None, f"Error getting server info: {str(e)}"
    
    def get_debug_info(self) -> Tuple[Optional[Dict], Optional[str]]:
        """Get debug information for troubleshooting"""
        try:
            # Get response with headers
            data, error, headers = self.make_request("/api/json", return_headers=True)
            
            if error:
                return None, f"Debug Error: {error}"
            
            debug_info = {
                'headers': headers,
                'json_keys': list(data.keys()) if isinstance(data, dict) else [],
                'header_version': self.get_version_from_headers(headers),
                'json_version': data.get('version', 'Not found in JSON'),
                'sample_data': {}
            }
            
            # Add sample data
            if isinstance(data, dict):
                sample_keys = list(data.keys())[:10]  # Show first 10 keys
                for key in sample_keys:
                    value = str(data[key])[:100]  # Limit value length
                    debug_info['sample_data'][key] = value
            
            return debug_info, None
        except Exception as e:
            return None, f"Debug function error: {str(e)}"


# Global instance for easy access
jenkins = JenkinsAPI()