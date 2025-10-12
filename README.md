# Smart City Dashboard

A comprehensive smart city management platform featuring real-time weather monitoring, intelligent lighting control, and cybersecurity SOAR (Security Orchestration, Automation, and Response) capabilities for Mumbai's critical infrastructure zones.

## 🌟 Features

### Weather Intelligence & Lighting Control
- **Real-time Weather Monitoring**: AI-powered weather analysis and prediction
- **Smart Lighting System**: Automated brightness adjustment based on weather conditions
- **Zone-based Management**: Control lighting for different city zones (Airport, Hospital, Residential)
- **Manual Override**: Direct control over individual light poles
- **Live Analytics**: Real-time metrics and fleet analytics

### Cybersecurity SOAR Platform
- **Multi-zone Security Monitoring**: Protect critical infrastructure zones
- **Automated Threat Detection**: AI-powered anomaly detection and threat analysis
- **Incident Response**: Automated playbook execution and mitigation
- **Real-time Alerts**: Instant notifications for security events
- **Compliance Tracking**: Monitor security compliance across zones

### Interactive Dashboard
- **Live Map Interface**: Interactive Leaflet-based city map
- **Real-time Updates**: WebSocket-powered live data streaming
- **Responsive Design**: Modern UI built with Next.js and Tailwind CSS
- **Zone Details Panel**: Detailed information for each city zone
- **Analytics Hub**: Comprehensive metrics and visualizations

## 🏗️ Architecture

### Backend Services
- **Weather Service** (`backend/weather/`): LangGraph-powered weather intelligence
- **Cybersecurity Service** (`backend/cybersecurity/`): SOAR pipeline with threat detection
- **FastAPI**: RESTful APIs with WebSocket support
- **LangChain Integration**: AI agents for decision making

### Frontend Application
- **Next.js 15**: React framework with TypeScript
- **Redux Toolkit**: State management
- **Leaflet Maps**: Interactive mapping
- **Tailwind CSS**: Modern styling
- **Real-time Communication**: WebSocket integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/soham4204/Smart_City_Dashboard.git
   cd Smart_City_Dashboard
   ```

2. **Setup Backend Services**

   **Weather Service:**
   ```bash
   cd backend/weather
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

   **Cybersecurity Service:**
   ```bash
   cd backend/cybersecurity
   pip install -r requirements.txt
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start Backend Services**
   
   **Weather Service:**
   ```bash
   cd backend/weather
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python main.py
   ```
   Service runs on `http://localhost:8000`

   **Cybersecurity Service:**
   ```bash
   cd backend/cybersecurity
   python main.py
   ```
   Service runs on `http://localhost:8001`

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Application runs on `http://localhost:3000`

## 📊 API Endpoints

### Weather Service (`http://localhost:8000`)

- `GET /api/v1/dashboard/initial-state` - Get initial dashboard state
- `POST /api/v1/simulation/weather` - Simulate weather scenarios
- `POST /api/v1/poles/{pole_id}/override` - Manual pole control
- `GET /api/v1/agent/logs` - Get agent activity logs
- `WebSocket /ws/updates` - Real-time updates

### Cybersecurity Service (`http://localhost:8001`)

- `GET /api/v1/cyber/initial-state` - Get cybersecurity dashboard state
- `POST /api/v1/cyber/simulate` - Simulate cyber attacks
- `GET /api/v1/cyber/zones/{zone_id}/details` - Get zone details
- `GET /api/v1/cyber/incidents` - Get security incidents
- `GET /api/v1/cyber/events/stream` - Get event stream
- `WebSocket /ws/updates` - Real-time security updates

## 🎯 City Zones

### Weather Zones
- **CSM International Airport**: High-priority lighting control
- **KEM Hospital**: Critical infrastructure monitoring
- **Dadar Residential Area**: Community lighting management

### Cybersecurity Zones
- **CSM International Airport**: Aviation security
- **KEM Hospital**: Healthcare data protection
- **Defence Installation**: Military-grade security
- **Mumbai University**: Educational institution security
- **Bandra Kurla Complex**: Financial district protection

## 🔧 Configuration

### Environment Variables
Create `.env` files in backend directories:

**Weather Service:**
```env
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
PINECONE_API_KEY=your_pinecone_key
```

**Cybersecurity Service:**
```env
GROQ_API_KEY=your_groq_key
LANGCHAIN_API_KEY=your_langchain_key
```

### Zone Configuration
Modify zone settings in `backend/weather/main.py`:
```python
ZONE_CONFIGS = {
    "CSM International Airport": {
        "heat_threshold": 38,
        "congestion_threshold": 0.8
    },
    # Add more zones...
}
```

## 🧪 Testing

### Weather Service Tests
```bash
cd backend/weather
python test_cyber.py
```

### Frontend Tests
```bash
cd frontend
npm run lint
npm run build
```

## 📈 Monitoring & Analytics

### Real-time Metrics
- Light pole status and brightness levels
- Weather condition impact analysis
- Security incident response times
- Zone compliance scores

### Logs & Events
- Agent decision logs (`backend/weather/events.log`)
- Security event streams
- System performance metrics

## 🔒 Security Features

### SOAR Pipeline
1. **Detection**: Automated threat detection
2. **Analysis**: AI-powered threat analysis
3. **Response**: Automated playbook execution
4. **Validation**: Threat neutralization verification

### Attack Simulation
- Ransomware detection
- Brute force protection
- DDoS mitigation
- Data exfiltration prevention
- Advanced Persistent Threat (APT) detection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in each service directory
- Review the API endpoints documentation

## 🚧 Roadmap

### Upcoming Features
- [ ] Database integration for persistent data
- [ ] Mobile application support
- [ ] Advanced AI/ML models for prediction
- [ ] Integration with IoT sensors
- [ ] Multi-city support
- [ ] Advanced reporting and analytics

### Current Development
- Enhanced cybersecurity threat detection
- Improved weather prediction accuracy
- Real-time sensor data integration
- Performance optimization

---

**Built with ❤️ for Smart City Innovation**
