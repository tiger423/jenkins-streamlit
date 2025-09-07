export interface ConnectionStatus {
  connected: boolean;
  message: string;
}

export interface JenkinsJob {
  name: string;
  color: string;
  url: string;
  buildable: boolean;
  description?: string;
}

export interface JobDetail {
  name: string;
  description?: string;
  buildable: boolean;
  color: string;
  url: string;
  pipelineScript?: string;
  configXml?: string;
  lastBuild?: {
    number: number;
    url: string;
    result: string;
    timestamp: number;
  };
  builds?: Array<{
    number: number;
    url: string;
    result: string;
    timestamp: number;
  }>;
}

export interface ServerInfo {
  version: string;
  node_name: string;
  user_info: string;
  user_id: string;
  plugin_count: number | string;
  headers: Record<string, string>;
  server_data: any;
}

export interface DebugInfo {
  headers: Record<string, string>;
  json_keys: string[];
  header_version: string | null;
  json_version: string;
  sample_data: Record<string, string>;
}
