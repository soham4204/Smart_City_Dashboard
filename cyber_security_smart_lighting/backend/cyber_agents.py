# backend/cyber_agents.py
import os
import json
import random
from typing import TypedDict, Dict, List, Any, Optional
from datetime import datetime, timedelta
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from enum import Enum
import hashlib
import re

# Load API key from environment or use directly
API_KEY = os.getenv("GROQ_API_KEY")

# Initialize LLM for cybersecurity agents
cyber_llm = ChatGroq(
    api_key=API_KEY,
    temperature=0.1,  # Lower temperature for more consistent security decisions
    model_name="llama-3.1-8b-instant"
)

# ===================== ENUMS AND CONSTANTS =====================

class ThreatSeverity(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ZoneType(Enum):
    AIRPORT = "airport_zone"
    HOSPITAL = "hospital_zone"
    RESIDENTIAL = "residential_zone"
    DEFENCE = "defence_zone"
    EDUCATION = "education_zone"
    COMMERCIAL = "commercial_zone"

class SecurityState(Enum):
    GREEN = "GREEN"  # Secure
    YELLOW = "YELLOW"  # Warning
    RED = "RED"  # Active threat

# MITRE ATT&CK Framework TTPs (simplified)
MITRE_TTPS = {
    "T1190": "Exploit Public-Facing Application",
    "T1133": "External Remote Services",
    "T1078": "Valid Accounts",
    "T1486": "Data Encrypted for Impact (Ransomware)",
    "T1040": "Network Sniffing",
    "T1055": "Process Injection",
    "T1003": "OS Credential Dumping",
    "T1021": "Remote Services",
    "T1071": "Application Layer Protocol",
    "T1027": "Obfuscated Files or Information"
}

# ===================== STATE DEFINITION =====================

class CyberSecurityState(TypedDict):
    """State management for the SOAR pipeline"""
    zone_id: str
    zone_type: str
    raw_telemetry: List[Dict[str, Any]]
    normalized_telemetry: List[Dict[str, Any]]
    anomalies: List[Dict[str, Any]]
    threat_intelligence: Dict[str, Any]
    response_playbook: Dict[str, Any]
    execution_status: Dict[str, Any]
    validation_results: Dict[str, Any]
    security_state: str
    incident_id: Optional[str]
    time_to_detection: Optional[float]
    time_to_mitigation: Optional[float]

# ===================== AGENT 1: TELEMETRY AGENT (TA) =====================

class TelemetryAgent:
    """Captures, standardizes, filters, and performs PII/PHI redaction"""
    
    def __init__(self):
        self.pii_patterns = [
            r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
            r'\b\d{12}\b',  # Aadhaar number
            r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b',  # PAN
            r'\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b',  # Credit card
            r'\b\d{10}\b',  # Phone number
        ]
    
    def redact_pii(self, text: str) -> str:
        """Redact PII/PHI from text data"""
        for pattern in self.pii_patterns:
            text = re.sub(pattern, '[REDACTED]', text)
        return text
    
    def normalize_telemetry(self, raw_data: List[Dict]) -> List[Dict]:
        """Standardize telemetry data format"""
        normalized = []
        for event in raw_data:
            normalized_event = {
                'timestamp': event.get('timestamp', datetime.now().isoformat()),
                'source_ip': event.get('source_ip', 'unknown'),
                'destination_ip': event.get('destination_ip', 'unknown'),
                'event_type': event.get('event_type', 'unknown'),
                'severity': event.get('severity', 'LOW'),
                'description': self.redact_pii(event.get('description', '')),
                'raw_event': event
            }
            normalized.append(normalized_event)
        return normalized
    
    def process(self, state: CyberSecurityState) -> Dict:
        """Main processing function for Telemetry Agent"""
        print(f"[TA] Processing telemetry for zone: {state['zone_id']}")
        
        # Simulate telemetry capture if none provided
        if not state.get('raw_telemetry'):
            state['raw_telemetry'] = self.generate_sample_telemetry(state['zone_type'])
        
        # Normalize and redact
        normalized = self.normalize_telemetry(state['raw_telemetry'])
        
        # Extra redaction for healthcare/education zones
        if state['zone_type'] in ['education_zone', 'hospital_zone']:
            print("[TA] Applying enhanced PII/PHI redaction for compliance")
            for event in normalized:
                event['description'] = self.redact_pii(event['description'])
        
        return {'normalized_telemetry': normalized}
    
    def generate_sample_telemetry(self, zone_type: str) -> List[Dict]:
        """Generate sample telemetry data for testing"""
        events = []
        event_types = ['firewall_block', 'ids_alert', 'failed_login', 'anomalous_traffic', 'port_scan']
        
        for i in range(random.randint(5, 15)):
            events.append({
                'timestamp': (datetime.now() - timedelta(minutes=random.randint(0, 60))).isoformat(),
                'source_ip': f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                'destination_ip': f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}",
                'event_type': random.choice(event_types),
                'severity': random.choice(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
                'description': f"Security event detected in {zone_type}: potential threat activity",
                'port': random.randint(1, 65535)
            })
        return events

# ===================== AGENT 2: ANOMALY DETECTION AGENT (ADA) =====================

class AnomalyDetectionAgent:
    """Establishes baselines and detects anomalies using ML and rules"""
    
    def __init__(self):
        self.baseline_thresholds = {
            'failed_login': 5,  # More than 5 failed logins is anomalous
            'port_scan': 10,  # More than 10 port scans
            'anomalous_traffic': 3,  # More than 3 anomalous traffic events
        }
        
    def detect_anomalies(self, telemetry: List[Dict]) -> List[Dict]:
        """Detect anomalies in normalized telemetry"""
        anomalies = []
        event_counts = {}
        
        # Count events by type and source
        for event in telemetry:
            key = f"{event['event_type']}_{event['source_ip']}"
            event_counts[key] = event_counts.get(key, 0) + 1
        
        # Check against thresholds
        for key, count in event_counts.items():
            event_type = key.split('_')[0] + '_' + key.split('_')[1]
            source_ip = '_'.join(key.split('_')[2:])
            
            for threshold_type, threshold_value in self.baseline_thresholds.items():
                if threshold_type in key and count > threshold_value:
                    anomaly = {
                        'type': 'threshold_exceeded',
                        'event_type': event_type,
                        'source_ip': source_ip,
                        'count': count,
                        'threshold': threshold_value,
                        'severity': self.calculate_severity(count, threshold_value),
                        'confidence': min(0.9, count / (threshold_value * 2)),
                        'timestamp': datetime.now().isoformat()
                    }
                    anomalies.append(anomaly)
        
        # Check for pattern-based anomalies
        pattern_anomalies = self.detect_pattern_anomalies(telemetry)
        anomalies.extend(pattern_anomalies)
        
        return anomalies
    
    def detect_pattern_anomalies(self, telemetry: List[Dict]) -> List[Dict]:
        """Detect pattern-based anomalies"""
        anomalies = []
        
        # Check for rapid-fire events (time-based)
        sorted_events = sorted(telemetry, key=lambda x: x['timestamp'])
        for i in range(1, len(sorted_events)):
            if sorted_events[i]['source_ip'] == sorted_events[i-1]['source_ip']:
                time_diff = (datetime.fromisoformat(sorted_events[i]['timestamp']) - 
                           datetime.fromisoformat(sorted_events[i-1]['timestamp'])).total_seconds()
                if time_diff < 1:  # Events less than 1 second apart
                    anomalies.append({
                        'type': 'rapid_fire_events',
                        'source_ip': sorted_events[i]['source_ip'],
                        'severity': 'HIGH',
                        'confidence': 0.8,
                        'timestamp': sorted_events[i]['timestamp']
                    })
        
        return anomalies
    
    def calculate_severity(self, count: int, threshold: int) -> str:
        """Calculate severity based on how much threshold was exceeded"""
        ratio = count / threshold
        if ratio > 5:
            return 'CRITICAL'
        elif ratio > 3:
            return 'HIGH'
        elif ratio > 1.5:
            return 'MEDIUM'
        return 'LOW'
    
    def process(self, state: CyberSecurityState) -> Dict:
        """Main processing function for Anomaly Detection Agent"""
        print(f"[ADA] Detecting anomalies for zone: {state['zone_id']}")
        
        telemetry = state.get('normalized_telemetry', [])
        anomalies = self.detect_anomalies(telemetry)
        
        if anomalies:
            print(f"[ADA] Detected {len(anomalies)} anomalies")
            for anomaly in anomalies[:3]:  # Show first 3
                print(f"  - {anomaly['type']}: {anomaly.get('severity', 'UNKNOWN')}")
        
        return {'anomalies': anomalies}

# ===================== AGENT 3: THREAT INTELLIGENCE RETRIEVAL AGENT (TIRA) =====================

class ThreatIntelligenceAgent:
    """Enriches alerts with threat intelligence and maps to MITRE ATT&CK"""
    
    def __init__(self):
        self.knowledge_graph = self.build_knowledge_graph()
        
    def build_knowledge_graph(self) -> Dict:
        """Build a knowledge graph of assets and their criticality"""
        return {
            'airport_zone': {
                'critical_assets': ['runway_lighting_system', 'air_traffic_control', 'baggage_handling'],
                'mission_criticality': 'CRITICAL',
                'dependencies': ['power_grid', 'network_backbone'],
                'common_threats': ['T1190', 'T1133', 'T1040']
            },
            'hospital_zone': {
                'critical_assets': ['patient_records', 'life_support_systems', 'pharmacy_systems'],
                'mission_criticality': 'CRITICAL',
                'dependencies': ['database_servers', 'medical_devices'],
                'common_threats': ['T1486', 'T1078', 'T1003']
            },
            'defence_zone': {
                'critical_assets': ['classified_systems', 'command_control', 'surveillance'],
                'mission_criticality': 'CRITICAL',
                'dependencies': ['secure_comms', 'satellite_links'],
                'common_threats': ['T1055', 'T1021', 'T1071']
            },
            'education_zone': {
                'critical_assets': ['student_records', 'research_data', 'learning_platforms'],
                'mission_criticality': 'HIGH',
                'dependencies': ['cloud_services', 'databases'],
                'common_threats': ['T1078', 'T1190', 'T1486']
            }
        }
    
    def map_to_mitre(self, anomalies: List[Dict]) -> List[str]:
        """Map detected anomalies to MITRE ATT&CK TTPs"""
        ttps = []
        
        for anomaly in anomalies:
            if 'failed_login' in anomaly.get('event_type', ''):
                ttps.append('T1078')  # Valid Accounts
            elif 'port_scan' in anomaly.get('event_type', ''):
                ttps.append('T1040')  # Network Sniffing
            elif 'anomalous_traffic' in anomaly.get('event_type', ''):
                ttps.append('T1071')  # Application Layer Protocol
            elif anomaly.get('type') == 'rapid_fire_events':
                ttps.append('T1190')  # Exploit Public-Facing Application
        
        return list(set(ttps))  # Remove duplicates
    
    def assess_mission_impact(self, zone_type: str, ttps: List[str]) -> Dict:
        """Assess the mission impact of detected threats"""
        zone_info = self.knowledge_graph.get(zone_type, {})
        
        # Check if any detected TTPs match common threats for this zone
        matching_threats = [ttp for ttp in ttps if ttp in zone_info.get('common_threats', [])]
        
        impact_score = len(matching_threats) * 25 + len(ttps) * 10
        
        return {
            'mission_criticality': zone_info.get('mission_criticality', 'MEDIUM'),
            'affected_assets': zone_info.get('critical_assets', []),
            'impact_score': min(100, impact_score),
            'risk_level': 'CRITICAL' if impact_score > 75 else 'HIGH' if impact_score > 50 else 'MEDIUM'
        }
    
    def process(self, state: CyberSecurityState) -> Dict:
        """Main processing function for Threat Intelligence Agent"""
        print(f"[TIRA] Enriching threat intelligence for zone: {state['zone_id']}")
        
        anomalies = state.get('anomalies', [])
        zone_type = state['zone_type']
        
        # Map to MITRE ATT&CK
        ttps = self.map_to_mitre(anomalies)
        
        # Assess mission impact
        mission_impact = self.assess_mission_impact(zone_type, ttps)
        
        threat_intelligence = {
            'mitre_ttps': ttps,
            'ttp_descriptions': {ttp: MITRE_TTPS.get(ttp, 'Unknown') for ttp in ttps},
            'mission_impact': mission_impact,
            'threat_actors': self.identify_threat_actors(ttps),
            'recommended_priority': mission_impact['risk_level'],
            'timestamp': datetime.now().isoformat()
        }
        
        if ttps:
            print(f"[TIRA] Identified TTPs: {', '.join(ttps)}")
            print(f"[TIRA] Risk Level: {mission_impact['risk_level']}")
        
        return {'threat_intelligence': threat_intelligence}
    
    def identify_threat_actors(self, ttps: List[str]) -> List[str]:
        """Identify potential threat actors based on TTPs"""
        actors = []
        
        if 'T1486' in ttps:
            actors.append('Ransomware Groups')
        if 'T1055' in ttps or 'T1003' in ttps:
            actors.append('APT Groups')
        if 'T1190' in ttps:
            actors.append('Opportunistic Attackers')
        
        return actors if actors else ['Unknown']

# ===================== AGENT 4: DECISION ENGINE AGENT (DEA) =====================

class DecisionEngineAgent:
    """Generates dynamic, adaptive response playbooks"""
    
    def __init__(self):
        self.playbook_templates = self.load_playbook_templates()
    
    def load_playbook_templates(self) -> Dict:
        """Load response playbook templates for different scenarios"""
        return {
            'ransomware': {
                'name': 'Ransomware Response',
                'steps': [
                    {'action': 'isolate_affected_systems', 'priority': 1},
                    {'action': 'backup_critical_data', 'priority': 2},
                    {'action': 'block_command_control_ips', 'priority': 3},
                    {'action': 'deploy_edr_scan', 'priority': 4},
                    {'action': 'notify_incident_response_team', 'priority': 5}
                ]
            },
            'brute_force': {
                'name': 'Brute Force Response',
                'steps': [
                    {'action': 'block_source_ip', 'priority': 1},
                    {'action': 'enforce_account_lockout', 'priority': 2},
                    {'action': 'enable_mfa', 'priority': 3},
                    {'action': 'reset_compromised_passwords', 'priority': 4}
                ]
            },
            'data_exfiltration': {
                'name': 'Data Exfiltration Response',
                'steps': [
                    {'action': 'block_outbound_traffic', 'priority': 1},
                    {'action': 'isolate_compromised_endpoint', 'priority': 2},
                    {'action': 'capture_network_traffic', 'priority': 3},
                    {'action': 'forensic_analysis', 'priority': 4}
                ]
            },
            'zero_trust': {
                'name': 'Zero Trust Response',
                'steps': [
                    {'action': 'enforce_microsegmentation', 'priority': 1},
                    {'action': 'continuous_authentication', 'priority': 2},
                    {'action': 'least_privilege_enforcement', 'priority': 3},
                    {'action': 'encrypt_all_traffic', 'priority': 4}
                ]
            }
        }
    
    def generate_playbook(self, threat_intel: Dict, zone_type: str) -> Dict:
        """Generate adaptive response playbook based on threat intelligence"""
        ttps = threat_intel.get('mitre_ttps', [])
        risk_level = threat_intel.get('mission_impact', {}).get('risk_level', 'MEDIUM')
        
        # Select appropriate template
        if 'T1486' in ttps:
            template = self.playbook_templates['ransomware']
        elif 'T1078' in ttps:
            template = self.playbook_templates['brute_force']
        elif 'T1040' in ttps or 'T1071' in ttps:
            template = self.playbook_templates['data_exfiltration']
        else:
            template = self.playbook_templates['zero_trust']
        
        # Customize for zone type
        playbook = {
            'playbook_id': hashlib.md5(f"{datetime.now().isoformat()}".encode()).hexdigest()[:8],
            'name': template['name'],
            'zone_type': zone_type,
            'risk_level': risk_level,
            'steps': self.customize_steps(template['steps'], zone_type),
            'estimated_time': len(template['steps']) * 2,  # 2 minutes per step
            'automation_level': 'FULL' if risk_level in ['CRITICAL', 'HIGH'] else 'SEMI',
            'generated_at': datetime.now().isoformat()
        }
        
        return playbook
    
    def customize_steps(self, steps: List[Dict], zone_type: str) -> List[Dict]:
        """Customize playbook steps based on zone requirements"""
        customized = steps.copy()
        
        # Add zone-specific actions
        if zone_type == 'defence_zone':
            customized.insert(0, {'action': 'activate_zero_trust_mode', 'priority': 0})
            customized.append({'action': 'deploy_honeypots', 'priority': len(customized)})
        elif zone_type == 'hospital_zone':
            customized.insert(0, {'action': 'ensure_life_support_continuity', 'priority': 0})
            customized.append({'action': 'notify_medical_staff', 'priority': len(customized)})
        elif zone_type == 'airport_zone':
            customized.insert(0, {'action': 'verify_ot_ics_isolation', 'priority': 0})
            customized.append({'action': 'activate_backup_systems', 'priority': len(customized)})
        
        return sorted(customized, key=lambda x: x['priority'])
    
    def process(self, state: CyberSecurityState) -> Dict:
        """Main processing function for Decision Engine Agent"""
        print(f"[DEA] Generating response playbook for zone: {state['zone_id']}")
        
        threat_intel = state.get('threat_intelligence', {})
        zone_type = state['zone_type']
        
        # Use LLM to enhance decision making
        prompt = f"""
        As a cybersecurity decision engine, analyze this threat intelligence and confirm the response strategy:
        
        Zone: {zone_type}
        Detected TTPs: {threat_intel.get('mitre_ttps', [])}
        Risk Level: {threat_intel.get('mission_impact', {}).get('risk_level', 'MEDIUM')}
        
        Should we proceed with automated response? Reply with YES or NO and brief reason.
        """
        
        llm_response = cyber_llm.invoke(prompt)
        proceed = 'YES' in llm_response.content.upper()
        
        if proceed:
            playbook = self.generate_playbook(threat_intel, zone_type)
            print(f"[DEA] Generated playbook: {playbook['name']} with {len(playbook['steps'])} steps")
        else:
            playbook = {
                'playbook_id': 'manual_review',
                'name': 'Manual Review Required',
                'steps': [{'action': 'escalate_to_human_operator', 'priority': 1}],
                'reason': llm_response.content
            }
        
        return {'response_playbook': playbook}

# ===================== AGENT 5: EXECUTION & VALIDATION AGENT (EVA) =====================

class ExecutionValidationAgent:
    """Executes response playbooks and validates mitigation success"""
    
    def __init__(self):
        self.execution_status = {}
        
    def execute_action(self, action: Dict) -> Dict:
        """Simulate execution of a single action"""
        action_name = action['action']
        
        # Simulate execution with success probability
        success_probability = 0.95 if action['priority'] < 3 else 0.90
        success = random.random() < success_probability
        
        result = {
            'action': action_name,
            'status': 'SUCCESS' if success else 'FAILED',
            'timestamp': datetime.now().isoformat(),
            'details': f"Action {action_name} {'completed successfully' if success else 'failed to execute'}"
        }
        
        # Simulate execution time
        import time
        time.sleep(0.1)  # Small delay to simulate execution
        
        return result
    
    def execute_playbook(self, playbook: Dict) -> Dict:
        """Execute all steps in the playbook"""
        execution_results = []
        overall_success = True
        
        print(f"[EVA] Executing playbook: {playbook['name']}")
        
        for step in playbook['steps']:
            result = self.execute_action(step)
            execution_results.append(result)
            
            if result['status'] == 'FAILED':
                overall_success = False
                print(f"  ✗ {step['action']} - FAILED")
                # Implement retry logic for critical actions
                if step['priority'] < 2:  # Retry critical actions
                    print(f"  ↻ Retrying {step['action']}...")
                    result = self.execute_action(step)
                    execution_results.append(result)
                    if result['status'] == 'SUCCESS':
                        overall_success = True
                        print(f"  ✓ {step['action']} - SUCCESS (on retry)")
            else:
                print(f"  ✓ {step['action']} - SUCCESS")
        
        return {
            'playbook_id': playbook['playbook_id'],
            'execution_results': execution_results,
            'overall_success': overall_success,
            'completed_at': datetime.now().isoformat()
        }
    
    def validate_mitigation(self, execution_status: Dict, initial_anomalies: List[Dict]) -> Dict:
        """Validate that the mitigation was successful"""
        validation_checks = []
        
        # Check if all critical actions succeeded
        critical_actions_success = all(
            r['status'] == 'SUCCESS' 
            for r in execution_status['execution_results'] 
            if 'isolate' in r['action'] or 'block' in r['action']
        )
        
        validation_checks.append({
            'check': 'critical_actions',
            'passed': critical_actions_success,
            'details': 'All critical containment actions completed'
        })
        
        # Simulate checking if threats are still active
        threats_neutralized = random.random() < 0.9 if critical_actions_success else False
        validation_checks.append({
            'check': 'threat_neutralization',
            'passed': threats_neutralized,
            'details': 'No active threats detected post-mitigation'
        })
        
        # Check system restoration
        systems_restored = execution_status['overall_success']
        validation_checks.append({
            'check': 'system_restoration',
            'passed': systems_restored,
            'details': 'Systems restored to normal operation'
        })
        
        # Overall validation result
        all_passed = all(check['passed'] for check in validation_checks)
        
        return {
            'validation_passed': all_passed,
            'checks': validation_checks,
            'new_security_state': SecurityState.GREEN.value if all_passed else SecurityState.YELLOW.value,
            'validated_at': datetime.now().isoformat()
        }
    
    def process(self, state: CyberSecurityState) -> Dict:
        """Main processing function for Execution & Validation Agent"""
        print(f"[EVA] Executing and validating response for zone: {state['zone_id']}")
        
        playbook = state.get('response_playbook', {})
        anomalies = state.get('anomalies', [])
        
        # Execute the playbook
        execution_status = self.execute_playbook(playbook)
        
        # Validate the mitigation
        validation_results = self.validate_mitigation(execution_status, anomalies)
        
        print(f"[EVA] Validation: {'PASSED ✓' if validation_results['validation_passed'] else 'FAILED ✗'}")
        print(f"[EVA] New Security State: {validation_results['new_security_state']}")
        
        return {
            'execution_status': execution_status,
            'validation_results': validation_results,
            'security_state': validation_results['new_security_state']
        }

# ===================== SOAR PIPELINE ORCHESTRATION =====================

class SOARPipeline:
    """Orchestrates the complete SOAR pipeline"""
    
    def __init__(self):
        self.telemetry_agent = TelemetryAgent()
        self.anomaly_agent = AnomalyDetectionAgent()
        self.threat_intel_agent = ThreatIntelligenceAgent()
        self.decision_agent = DecisionEngineAgent()
        self.execution_agent = ExecutionValidationAgent()
        
        # Build the pipeline graph
        self.pipeline = self.build_pipeline()
    
    def build_pipeline(self) -> StateGraph:
        """Build the SOAR pipeline using LangGraph"""
        workflow = StateGraph(CyberSecurityState)
        
        # Add nodes for each agent
        workflow.add_node("telemetry", self.telemetry_agent.process)
        workflow.add_node("anomaly_detection", self.anomaly_agent.process)
        workflow.add_node("threat_intelligence", self.threat_intel_agent.process)
        workflow.add_node("decision_engine", self.decision_agent.process)
        workflow.add_node("execution_validation", self.execution_agent.process)
        
        # Define the flow
        workflow.set_entry_point("telemetry")
        workflow.add_edge("telemetry", "anomaly_detection")
        workflow.add_edge("anomaly_detection", "threat_intelligence")
        workflow.add_edge("threat_intelligence", "decision_engine")
        workflow.add_edge("decision_engine", "execution_validation")
        workflow.add_edge("execution_validation", END)
        
        return workflow.compile()
    
    def process_security_event(self, zone_id: str, zone_type: str, raw_telemetry: List[Dict] = None) -> Dict:
        """Process a security event through the complete SOAR pipeline"""
        
        incident_id = hashlib.md5(f"{zone_id}_{datetime.now().isoformat()}".encode()).hexdigest()[:12]
        
        initial_state = {
            'zone_id': zone_id,
            'zone_type': zone_type,
            'raw_telemetry': raw_telemetry or [],
            'incident_id': incident_id,
            'security_state': SecurityState.RED.value,  # Start with RED during active investigation
            'time_to_detection': None,
            'time_to_mitigation': None
        }
        
        start_time = datetime.now()
        
        # Run the pipeline
        print(f"\n{'='*60}")
        print(f"SOAR PIPELINE INITIATED - Incident ID: {incident_id}")
        print(f"Zone: {zone_id} | Type: {zone_type}")
        print(f"{'='*60}\n")
        
        result = self.pipeline.invoke(initial_state)
        
        # Calculate metrics
        end_time = datetime.now()
        result['time_to_detection'] = 1.5  # Simulated detection time in minutes
        result['time_to_mitigation'] = (end_time - start_time).total_seconds() / 60  # In minutes
        
        print(f"\n{'='*60}")
        print(f"SOAR PIPELINE COMPLETED")
        print(f"Time to Detection: {result['time_to_detection']:.1f} minutes")
        print(f"Time to Mitigation: {result['time_to_mitigation']:.1f} minutes")
        print(f"Final Security State: {result['security_state']}")
        print(f"{'='*60}\n")
        
        return result

# ===================== HELPER FUNCTIONS =====================

def create_soar_app():
    """Create and return the SOAR pipeline application"""
    return SOARPipeline()

# Example usage function
def simulate_attack(zone_id: str = "airport_zone", zone_type: str = "airport_zone"):
    """Simulate an attack and process through SOAR pipeline"""
    pipeline = create_soar_app()
    
    # Simulate attack telemetry
    attack_telemetry = [
        {
            'timestamp': datetime.now().isoformat(),
            'source_ip': '10.0.0.100',
            'destination_ip': '192.168.1.50',
            'event_type': 'failed_login',
            'severity': 'HIGH',
            'description': 'Multiple failed login attempts detected'
        },
        {
            'timestamp': (datetime.now() - timedelta(seconds=5)).isoformat(),
            'source_ip': '10.0.0.100',
            'destination_ip': '192.168.1.50',
            'event_type': 'port_scan',
            'severity': 'MEDIUM',
            'description': 'Port scanning activity detected'
        }
    ] * 5  # Multiply to simulate multiple events
    
    result = pipeline.process_security_event(zone_id, zone_type, attack_telemetry)
    return result

if __name__ == "__main__":
    # Test the SOAR pipeline
    result = simulate_attack()
    print("\nFinal Result Summary:")
    print(f"  Incident ID: {result.get('incident_id')}")
    print(f"  Security State: {result.get('security_state')}")
    print(f"  Detected Anomalies: {len(result.get('anomalies', []))}")
    print(f"  MITRE TTPs: {result.get('threat_intelligence', {}).get('mitre_ttps', [])}")