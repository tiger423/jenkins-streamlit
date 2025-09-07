"""
Jenkins UI Module - Enhanced Layout with Sidebar
Provides web-based interface with collapsible sidebar and 3-column main layout.
"""
import streamlit as st
import xml.etree.ElementTree as ET
from jenkins_api import jenkins
from typing import Dict, List, Optional, Any


class JenkinsUI:
    """Jenkins UI Manager for Streamlit interface with enhanced layout"""
    
    def __init__(self):
        self.init_session_state()
    
    def init_session_state(self):
        """Initialize Streamlit session state variables"""
        if 'connection_status' not in st.session_state:
            st.session_state.connection_status = "Not connected"
        if 'selected_job' not in st.session_state:
            st.session_state.selected_job = None
        if 'jobs_list' not in st.session_state:
            st.session_state.jobs_list = []
        if 'column1_result' not in st.session_state:
            st.session_state.column1_result = None
        if 'column2_selected_job' not in st.session_state:
            st.session_state.column2_selected_job = None
        if 'show_job_detail' not in st.session_state:
            st.session_state.show_job_detail = False
        if 'column3_job_detail' not in st.session_state:
            st.session_state.column3_job_detail = None
    
    def render_sidebar(self):
        """Render the collapsible sidebar with all Jenkins functions"""
        with st.sidebar:
            st.header("Jenkins Control Panel")
            
            # Connection Section
            st.subheader("Connection")
            
            # Connection inputs
            server_url = st.text_input(
                "Server URL", 
                value="http://172.18.3.50:8080",
                help="Jenkins server URL with port"
            )
            
            username = st.text_input(
                "Username", 
                value="ve",
                help="Jenkins username"
            )
            
            password = st.text_input(
                "Password", 
                value="ve",
                type="password",
                help="Jenkins password"
            )
            
            # Connection buttons
            col1, col2 = st.columns(2)
            with col1:
                if st.button("Connect", use_container_width=True):
                    with st.spinner("Connecting..."):
                        success, message = jenkins.connect(server_url, username, password)
                        if success:
                            st.session_state.connection_status = "Connected"
                            st.success("Connected!")
                            self.refresh_jobs_list()
                        else:
                            st.session_state.connection_status = "Disconnected"
                            st.error("Failed!")
            
            with col2:
                if st.button("Disconnect", use_container_width=True):
                    jenkins.disconnect()
                    st.session_state.connection_status = "Disconnected"
                    st.session_state.jobs_list = []
                    st.session_state.selected_job = None
                    st.session_state.column2_selected_job = None
                    st.session_state.show_job_detail = False
                    st.session_state.column1_result = None
                    st.session_state.column3_job_detail = None
                    st.rerun()
            
            # Connection status
            st.info(f"Status: {st.session_state.connection_status}")
            
    
    def refresh_jobs_list(self):
        """Refresh the list of Jenkins jobs"""
        if jenkins.is_connected():
            jobs, error = jenkins.get_jobs()
            if error:
                st.session_state.jobs_list = []
            else:
                st.session_state.jobs_list = jobs or []
    
    def format_job_detail(self, job_detail: Dict, config_xml: Optional[str]) -> str:
        """Format job detail information for display"""
        lines = []
        lines.append(f"**Job Details: {job_detail.get('name', 'Unknown')}**")
        lines.append("")
        lines.append(f"• **Description:** {job_detail.get('description', 'No description')}")
        lines.append(f"• **Buildable:** {job_detail.get('buildable', 'Unknown')}")
        lines.append(f"• **Status Color:** {job_detail.get('color', 'Unknown')}")
        lines.append(f"• **URL:** {job_detail.get('url', 'Unknown')}")
        lines.append("")
        
        # Last build info
        last_build = job_detail.get('lastBuild')
        if last_build:
            lines.append("**Last Build:**")
            lines.append(f"• Number: #{last_build.get('number', 'Unknown')}")
            lines.append(f"• Result: {last_build.get('result', 'Unknown')}")
            timestamp = last_build.get('timestamp')
            if timestamp:
                import datetime
                dt = datetime.datetime.fromtimestamp(timestamp / 1000)
                lines.append(f"• Timestamp: {dt.strftime('%Y-%m-%d %H:%M:%S')}")
            lines.append("")
        
        # Recent builds
        builds = job_detail.get('builds', [])
        if builds:
            lines.append(f"**Recent Builds (Last {len(builds)}):**")
            for build in builds[:5]:  # Show last 5 builds
                lines.append(f"• #{build.get('number', 'Unknown')} - {build.get('result', 'Unknown')}")
            lines.append("")
        
        # Pipeline configuration
        if config_xml:
            lines.append("**Pipeline Configuration:**")
            lines.append("```xml")
            try:
                root = ET.fromstring(config_xml)
                # Look for pipeline script
                script_elements = root.findall('.//script')
                if script_elements:
                    lines.append("Pipeline Script:")
                    lines.append("```groovy")
                    lines.append(script_elements[0].text or "No script content")
                    lines.append("```")
                else:
                    # Show first 20 lines of XML config
                    xml_lines = config_xml.split('\n')
                    lines.extend(xml_lines[:20])
                    if len(xml_lines) > 20:
                        lines.append(f"... ({len(xml_lines) - 20} more lines)")
            except ET.ParseError:
                lines.append("Error parsing XML configuration")
            lines.append("```")
        
        return "\n".join(lines)
    
    def render_column1(self):
        """Render Column 1: Operation Functions"""
        st.header("️ Operations")
        
        if not jenkins.is_connected():
            st.warning("Please connect to Jenkins first")
            return
        
        # Test Connection
        if st.button(" Test Connection", use_container_width=True):
            with st.spinner("Testing connection..."):
                success, result = jenkins.test_connection()
                st.session_state.column1_result = {
                    'type': 'test_connection',
                    'success': success,
                    'data': result
                }
        
        # List All Jobs
        if st.button("List All Jobs", use_container_width=True):
            with st.spinner("Fetching jobs..."):
                jobs, error = jenkins.get_jobs()
                if error:
                    st.session_state.column1_result = {
                        'type': 'list_jobs',
                        'success': False,
                        'data': f"Error: {error}"
                    }
                else:
                    self.refresh_jobs_list()
                    job_list = []
                    for job in jobs:
                        name = job.get('name', 'Unknown')
                        color = job.get('color', 'unknown')
                        status_map = {
                            'blue': 'SUCCESS', 'red': 'FAILED', 'yellow': 'UNSTABLE',
                            'grey': 'PENDING', 'disabled': 'DISABLED', 'aborted': 'ABORTED'
                        }
                        status = status_map.get(color.replace('_anime', ''), color.upper())
                        job_list.append(f"• {name} - {status}")
                    
                    result_text = f"Found {len(jobs)} job(s):\n\n" + "\n".join(job_list)
                    st.session_state.column1_result = {
                        'type': 'list_jobs',
                        'success': True,
                        'data': result_text,
                        'jobs': jobs
                    }
        
        # Server Info
        if st.button("️ Server Info", use_container_width=True):
            with st.spinner("Getting server info..."):
                info, error = jenkins.get_server_info()
                if error:
                    st.session_state.column1_result = {
                        'type': 'server_info',
                        'success': False,
                        'data': f"Error: {error}"
                    }
                else:
                    result_text = f"""**Jenkins Server Information:**
- Version: {info['version']}
- Node Name: {info['node_name']}
- Current User: {info['user_info']}
- User ID: {info['user_id']}
- Installed Plugins: {info['plugin_count']}"""
                    st.session_state.column1_result = {
                        'type': 'server_info',
                        'success': True,
                        'data': result_text,
                        'raw_data': info
                    }
        
        # Debug Info
        if st.button(" Debug Info", use_container_width=True):
            with st.spinner("Getting debug info..."):
                debug_info, error = jenkins.get_debug_info()
                if error:
                    st.session_state.column1_result = {
                        'type': 'debug',
                        'success': False,
                        'data': f"Error: {error}"
                    }
                else:
                    debug_lines = []
                    debug_lines.append("=== HTTP HEADERS ===")
                    for key, value in debug_info['headers'].items():
                        debug_lines.append(f"{key}: {value}")
                    
                    debug_lines.append("\n=== JSON RESPONSE KEYS ===")
                    for key in debug_info['json_keys']:
                        debug_lines.append(f"• {key}")
                    
                    debug_lines.append("\n=== VERSION DETECTION ===")
                    debug_lines.append(f"From Headers: {debug_info['header_version']}")
                    debug_lines.append(f"From JSON: {debug_info['json_version']}")
                    
                    result_text = "\n".join(debug_lines)
                    st.session_state.column1_result = {
                        'type': 'debug',
                        'success': True,
                        'data': result_text,
                        'raw_data': debug_info
                    }
        
        # Job Selection Section (when jobs are available)
        if jenkins.is_connected() and st.session_state.jobs_list:
            st.markdown("---")
            st.subheader("📋 Job Selection")
            
            # Job selection dropdown
            job_options = ["Select a job..."] + [job['name'] for job in st.session_state.jobs_list]
            selected_job_name = st.selectbox(
                "Choose a job:",
                options=job_options,
                index=0 if not st.session_state.column2_selected_job else (
                    job_options.index(st.session_state.column2_selected_job) 
                    if st.session_state.column2_selected_job in job_options 
                    else 0
                )
            )
            
            # Update selected job
            if selected_job_name and selected_job_name != "Select a job...":
                st.session_state.column2_selected_job = selected_job_name
            else:
                st.session_state.column2_selected_job = None
            
            # Display Job Detail button (only show when job is selected)
            if st.session_state.column2_selected_job:
                if st.button("📋 Display Job Detail", use_container_width=True):
                    # Load job details for Column 2
                    with st.spinner(f"Loading details for {st.session_state.column2_selected_job}..."):
                        job_detail, error = jenkins.get_job_detail(st.session_state.column2_selected_job)
                        if error:
                            st.session_state.column3_job_detail = {
                                'type': 'job_detail_error',
                                'data': f"Error loading job details: {error}",
                                'success': False
                            }
                        else:
                            config_xml, config_error = jenkins.get_job_config(st.session_state.column2_selected_job)
                            st.session_state.column3_job_detail = {
                                'type': 'job_detail',
                                'data': self.format_job_detail(job_detail, config_xml),
                                'success': True,
                                'raw_data': {
                                    'job_detail': job_detail,
                                    'config_xml': config_xml,
                                    'config_error': config_error
                                }
                            }
                            st.session_state.show_job_detail = True
    
    def render_column2(self):
        """Render Column 2: All Results (Operation Results + Job Details)"""
        st.header("🎯 All Results")
        
        # SECTION 1: Operation Results from Column 1 (SIMPLIFIED - no job selection)
        if st.session_state.column1_result:
            result = st.session_state.column1_result
            result_type = result.get('type', 'unknown')
            success = result.get('success', False)
            
            # Display operation result status
            if success:
                st.success(f"✅ {result_type.replace('_', ' ').title()}")
            else:
                st.error(f"❌ {result_type.replace('_', ' ').title()}")
            
            # Display operation result data
            data = result.get('data', 'No data available')
            if result_type in ['server_info']:
                st.markdown(data)
            else:
                st.code(data, language="text")
            
            # Show raw data in expander for debugging (if available)
            if 'raw_data' in result:
                with st.expander("🔍 Raw Data"):
                    st.json(result['raw_data'])
        
        # SECTION 2: Job Details (when Display Job Detail is clicked from Column 1)
        if st.session_state.show_job_detail and st.session_state.column3_job_detail:
            st.markdown("---")  # Visual separator between sections
            st.subheader("🔍 Job Details")
            
            result = st.session_state.column3_job_detail
            success = result.get('success', False)
            
            # Display job details status
            if success:
                st.success(f"✅ Job Details: {st.session_state.column2_selected_job}")
            else:
                st.error(f"❌ Failed to load job details")
            
            # Display job detail data
            data = result.get('data', 'No data available')
            if success:
                st.markdown(data)
            else:
                st.code(data, language="text")
            
            # Show raw data in expander for debugging (if available)
            if 'raw_data' in result:
                with st.expander("🔍 Raw Data"):
                    st.json(result['raw_data'])
            
            # Clear button for job details
            if st.button("🧹 Clear Job Details", use_container_width=True):
                st.session_state.show_job_detail = False
                st.session_state.column3_job_detail = None
                st.rerun()
        
        # Show nothing when no results
        if not st.session_state.column1_result:
            pass
    
    
    def render(self):
        """Render the complete UI with sidebar and 2-column layout"""
        # Page configuration
        st.set_page_config(
            page_title="Jenkins POC - Enhanced Layout",
            page_icon="🔧",
            layout="wide",
            initial_sidebar_state="expanded"
        )
        
        # Main title
        st.title("🔧 Jenkins POC - Enhanced Layout")
        st.markdown("**Advanced Interface**: Collapsible Sidebar + 2-Column Main Layout")
        
        # Custom CSS for smaller fonts
        st.markdown("""
        <style>
        .main .block-container {
            font-size: 0.85rem;
        }
        .stButton > button {
            font-size: 0.8rem;
            height: 2.2rem;
        }
        h1, .main h1 {
            font-size: 1.6rem !important;
        }
        h2, .main h2 {
            font-size: 1.3rem !important;
        }
        h3, .main h3 {
            font-size: 1.1rem !important;
        }
        .stSelectbox label, .stTextInput label {
            font-size: 0.8rem !important;
        }
        .stMarkdown {
            font-size: 0.85rem;
        }
        .stCode {
            font-size: 0.75rem;
        }
        div[data-testid="stSidebar"] {
            font-size: 0.8rem;
        }
        .stInfo, .stSuccess, .stError, .stWarning {
            font-size: 0.8rem;
        }
        </style>
        """, unsafe_allow_html=True)
        
        # Render sidebar
        self.render_sidebar()
        
        # Create two-column main layout
        col1, col2 = st.columns([1, 2])
        
        with col1:
            # Column 1: Sidebar operations output
            self.render_column1()
        
        with col2:
            # Column 2: Main functions output
            self.render_column2()
        
        
        # Footer
        st.markdown("---")
        st.markdown("*Enterprise SSD Test Program - Jenkins Integration POC (2-Column Layout with Sidebar)*")


# Create UI instance
ui = JenkinsUI()


def main():
    """Main application entry point"""
    ui.render()


if __name__ == "__main__":
    main()