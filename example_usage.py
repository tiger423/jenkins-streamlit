"""
Example Usage: Jenkins API Module
Demonstrates how to use the jenkins_api module from other Python programs.
"""
from jenkins_api import jenkins
import json


def main():
    """Example usage of Jenkins API module"""
    print("=== Jenkins API Module Usage Example ===\n")
    
    # 1. Connect to Jenkins
    print("1. Connecting to Jenkins...")
    success, message = jenkins.connect(
        url="http://172.18.3.50:8080",
        username="ve",
        password="ve"
    )
    
    if not success:
        print(f"Connection failed: {message}")
        return
    
    print(f"✅ {message}\n")
    
    # 2. Test connection
    print("2. Testing connection...")
    success, result = jenkins.test_connection()
    print(f"{'✅' if success else '❌'} {result}\n")
    
    # 3. Get server info
    print("3. Getting server information...")
    info, error = jenkins.get_server_info()
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✅ Jenkins Version: {info['version']}")
        print(f"   Node Name: {info['node_name']}")
        print(f"   Current User: {info['user_info']}")
        print(f"   Plugins: {info['plugin_count']}\n")
    
    # 4. List all jobs
    print("4. Listing Jenkins jobs...")
    jobs, error = jenkins.get_jobs()
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✅ Found {len(jobs)} jobs:")
        for job in jobs[:5]:  # Show first 5 jobs
            name = job.get('name', 'Unknown')
            color = job.get('color', 'unknown')
            print(f"   • {name} - {color}")
        
        if len(jobs) > 5:
            print(f"   ... and {len(jobs) - 5} more jobs")
        print()
    
    # 5. Get detailed info for first job (if available)
    if jobs and len(jobs) > 0:
        first_job = jobs[0]
        job_name = first_job.get('name')
        
        print(f"5. Getting detailed info for job: {job_name}")
        job_detail, error = jenkins.get_job_detail(job_name)
        if error:
            print(f"❌ Error: {error}")
        else:
            print(f"✅ Job Details:")
            print(f"   • Description: {job_detail.get('description', 'No description')[:100]}...")
            print(f"   • Buildable: {job_detail.get('buildable', 'Unknown')}")
            print(f"   • Status: {job_detail.get('color', 'Unknown')}")
            
            last_build = job_detail.get('lastBuild')
            if last_build:
                print(f"   • Last Build: #{last_build.get('number')} - {last_build.get('result')}")
        print()
        
        # 6. Try to get job configuration
        print(f"6. Getting configuration for job: {job_name}")
        config_xml, error = jenkins.get_job_config(job_name)
        if error:
            print(f"❌ Config Error: {error}")
        else:
            print(f"✅ Config XML retrieved ({len(config_xml)} characters)")
            # Show first few lines
            lines = config_xml.split('\\n')[:3]
            for line in lines:
                print(f"   {line[:80]}{'...' if len(line) > 80 else ''}")
        print()
    
    # 7. Get debug information
    print("7. Getting debug information...")
    debug_info, error = jenkins.get_debug_info()
    if error:
        print(f"❌ Error: {error}")
    else:
        print("✅ Debug Info:")
        print(f"   • Headers: {len(debug_info['headers'])} entries")
        print(f"   • JSON Keys: {len(debug_info['json_keys'])} keys")
        print(f"   • Version from Headers: {debug_info['header_version']}")
        print(f"   • Version from JSON: {debug_info['json_version']}")
    print()
    
    # 8. Disconnect
    print("8. Disconnecting...")
    jenkins.disconnect()
    print("✅ Disconnected from Jenkins")
    
    print("\n=== Example completed successfully! ===")


def batch_job_analysis():
    """Example: Analyze multiple jobs in batch"""
    print("\n=== Batch Job Analysis Example ===\n")
    
    # Connect
    success, message = jenkins.connect("http://172.18.3.50:8080", "ve", "ve")
    if not success:
        print(f"Connection failed: {message}")
        return
    
    # Get all jobs
    jobs, error = jenkins.get_jobs()
    if error:
        print(f"Error getting jobs: {error}")
        return
    
    print(f"Analyzing {len(jobs)} jobs...\n")
    
    analysis = {
        'total_jobs': len(jobs),
        'buildable_jobs': 0,
        'disabled_jobs': 0,
        'successful_jobs': 0,
        'failed_jobs': 0,
        'jobs_with_builds': 0
    }
    
    for job in jobs:
        # Basic analysis
        if job.get('buildable', False):
            analysis['buildable_jobs'] += 1
        
        color = job.get('color', '')
        if 'blue' in color:
            analysis['successful_jobs'] += 1
        elif 'red' in color:
            analysis['failed_jobs'] += 1
        elif 'disabled' in color:
            analysis['disabled_jobs'] += 1
        
        # Get detailed info for more analysis
        job_name = job.get('name')
        job_detail, error = jenkins.get_job_detail(job_name)
        if not error and job_detail:
            if job_detail.get('lastBuild'):
                analysis['jobs_with_builds'] += 1
    
    # Print analysis results
    print("Job Analysis Results:")
    print(f"  Total Jobs: {analysis['total_jobs']}")
    print(f"  Buildable Jobs: {analysis['buildable_jobs']}")
    print(f"  Disabled Jobs: {analysis['disabled_jobs']}")
    print(f"  Successful Jobs: {analysis['successful_jobs']}")
    print(f"  Failed Jobs: {analysis['failed_jobs']}")
    print(f"  Jobs with Builds: {analysis['jobs_with_builds']}")
    
    # Calculate percentages
    if analysis['total_jobs'] > 0:
        success_rate = (analysis['successful_jobs'] / analysis['total_jobs']) * 100
        build_rate = (analysis['jobs_with_builds'] / analysis['total_jobs']) * 100
        print(f"\\n  Success Rate: {success_rate:.1f}%")
        print(f"  Build Rate: {build_rate:.1f}%")
    
    jenkins.disconnect()
    print("\\n=== Batch analysis completed! ===")


if __name__ == "__main__":
    # Run basic example
    main()
    
    # Run batch analysis example
    batch_job_analysis()