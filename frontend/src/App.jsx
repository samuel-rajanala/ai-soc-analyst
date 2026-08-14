import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  ChevronRight,
  Clock3,
  Crosshair,
  Database,
  Globe,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Target,
  X,
  Cpu,
  Wifi,
  Terminal,
  CheckCircle2,
  Layers,
  Zap,
} from "lucide-react";

import "./App.css";

const API = "https://ai-soc-analyst-sqmb.onrender.com";

function App() {
  const [alerts, setAlerts] = useState([]);
  const [activeView, setActiveView] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [investigating, setInvestigating] = useState(false);

  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  async function loadAlerts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/alerts`);

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();

      setAlerts(data.alerts || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the SOC backend.");
    } finally {
      setLoading(false);
    }
  }

  async function investigateAlert(index, alert) {
    try {
      setSelectedAlert({ index, alert });
      setInvestigation(null);
      setInvestigating(true);

      const response = await fetch(
        `${API}/alerts/${index}/investigate`
      );

      if (!response.ok) {
        throw new Error(
          `Investigation failed: ${response.status}`
        );
      }

      const data = await response.json();

      setInvestigation(data);
    } catch (err) {
      console.error(err);

      setInvestigation({
        error:
          "AI investigation failed. Check FastAPI and Ollama.",
      });
    } finally {
      setInvestigating(false);
    }
  }

  useEffect(() => {
    loadAlerts();

    const interval = setInterval(loadAlerts, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return alerts;
    }

    return alerts.filter((alert) =>
      JSON.stringify(alert)
        .toLowerCase()
        .includes(query)
    );
  }, [alerts, search]);

  const highAlerts = alerts.filter(
    (alert) =>
      alert.severity === "HIGH" ||
      alert.severity === "CRITICAL"
  ).length;

  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === "CRITICAL"
  ).length;

  const averageRisk =
    alerts.length > 0
      ? Math.round(
          alerts.reduce(
            (total, alert) =>
              total + (alert.risk_score || 0),
            0
          ) / alerts.length
        )
      : 0;

  const latestAlert =
    alerts.length > 0
      ? alerts[alerts.length - 1]
      : null;

  function navigate(view) {
    setActiveView(view);
    setSearch("");
  }

  function openAlert(alert) {
    const index = alerts.indexOf(alert);

    investigateAlert(index, alert);
  }

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <Shield size={25} />
          </div>

          <div>
            <h1>
              SOC<span>AI</span>
            </h1>

            <p>Junior Analyst</p>
          </div>

        </div>

        <nav>

          <div className="nav-section">
            MONITOR
          </div>

          <NavButton
            icon={<Activity size={18} />}
            label="Overview"
            active={activeView === "overview"}
            onClick={() => navigate("overview")}
          />

          <NavButton
            icon={<ShieldAlert size={18} />}
            label="Incidents"
            count={alerts.length}
            active={activeView === "incidents"}
            onClick={() => navigate("incidents")}
          />

          <NavButton
            icon={<Target size={18} />}
            label="Threat Intel"
            active={activeView === "threat-intel"}
            onClick={() => navigate("threat-intel")}
          />

          <NavButton
            icon={<BrainCircuit size={18} />}
            label="AI Analysis"
            active={activeView === "ai"}
            onClick={() => navigate("ai")}
          />

          <div className="nav-section">
            SYSTEM
          </div>

          <NavButton
            icon={<Server size={18} />}
            label="Assets"
            active={activeView === "assets"}
            onClick={() => navigate("assets")}
          />

          <NavButton
            icon={<Database size={18} />}
            label="Log Sources"
            active={activeView === "logs"}
            onClick={() => navigate("logs")}
          />

        </nav>

        <div className="sidebar-bottom">

          <StatusItem
            label="Detection Engine"
            status="Operational"
          />

          <StatusItem
            label="Qwen AI"
            status="Connected"
          />

        </div>

      </aside>


      {/* MAIN */}

      <main className="main">

        <header className="topbar">

          <div>

            <div className="breadcrumb">
              SECURITY OPERATIONS /{" "}
              <span>
                {getViewName(activeView)}
              </span>
            </div>

            <h2>
              {getViewTitle(activeView)}
            </h2>

          </div>

          <div className="topbar-right">

            <div className="live-indicator">
              <span />
              LIVE MONITORING
            </div>

            <button
              className="refresh-button"
              onClick={loadAlerts}
              title="Refresh alerts"
            >
              <RefreshCw
                size={17}
                className={loading ? "spin" : ""}
              />
            </button>

          </div>

        </header>


        {error && (
          <div className="backend-warning">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}


        {/* OVERVIEW */}

        {activeView === "overview" && (

          <Overview
            alerts={alerts}
            filteredAlerts={filteredAlerts}
            search={search}
            setSearch={setSearch}
            latestAlert={latestAlert}
            highAlerts={highAlerts}
            criticalAlerts={criticalAlerts}
            averageRisk={averageRisk}
            openAlert={openAlert}
          />

        )}


        {/* INCIDENTS */}

        {activeView === "incidents" && (

          <IncidentsPage
            alerts={filteredAlerts}
            search={search}
            setSearch={setSearch}
            openAlert={openAlert}
          />

        )}


        {/* THREAT INTEL */}

        {activeView === "threat-intel" && (

          <ThreatIntelPage
            alerts={alerts}
          />

        )}


        {/* AI */}

        {activeView === "ai" && (

          <AIPage
            alerts={alerts}
            openAlert={openAlert}
          />

        )}


        {/* ASSETS */}

        {activeView === "assets" && (

          <AssetsPage />

        )}


        {/* LOG SOURCES */}

        {activeView === "logs" && (

          <LogSourcesPage />

        )}


        <footer>

          <span>
            <Clock3 size={14} />

            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Waiting for data"}
          </span>

          <span>
            AI JUNIOR SOC ANALYST v0.1.0
          </span>

        </footer>

      </main>


      {/* INVESTIGATION MODAL */}

      {selectedAlert && (

        <InvestigationModal
          selected={selectedAlert}
          investigation={investigation}
          investigating={investigating}
          onClose={() => {
            setSelectedAlert(null);
            setInvestigation(null);
          }}
        />

      )}

    </div>
  );
}


/* =========================
   NAVIGATION
========================= */

function NavButton({
  icon,
  label,
  count,
  active,
  onClick,
}) {
  return (
    <button
      className={`nav-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >

      {icon}

      <span>{label}</span>

      {typeof count === "number" && count > 0 && (
        <span className="nav-count">
          {count}
        </span>
      )}

    </button>
  );
}


function StatusItem({ label, status }) {
  return (
    <div className="engine-status">

      <span className="status-dot" />

      <div>
        <strong>{label}</strong>
        <small>{status}</small>
      </div>

    </div>
  );
}


/* =========================
   OVERVIEW
========================= */

function Overview({
  alerts,
  filteredAlerts,
  search,
  setSearch,
  latestAlert,
  highAlerts,
  criticalAlerts,
  averageRisk,
  openAlert,
}) {
  return (
    <>

      <section className="hero">

        <div>

          <p className="eyebrow">
            AI-POWERED SECURITY MONITORING
          </p>

          <h3>
            Your security environment
            <br />

            <span>
              is being monitored.
            </span>
          </h3>

        </div>

        <div className="hero-ai">

          <div className="ai-orbit">
            <BrainCircuit size={32} />
          </div>

          <div>
            <strong>Qwen 2.5</strong>
            <p>
              AI investigation engine
            </p>
          </div>

        </div>

      </section>


      <section className="stats-grid">

        <StatCard
          icon={<ShieldAlert />}
          label="Active Alerts"
          value={alerts.length}
          sub="Detected incidents"
          danger={alerts.length > 0}
        />

        <StatCard
          icon={<AlertTriangle />}
          label="High Risk"
          value={highAlerts}
          sub={`${criticalAlerts} critical`}
          danger={highAlerts > 0}
        />

        <StatCard
          icon={<Crosshair />}
          label="Average Risk"
          value={`${averageRisk}%`}
          sub="Across active alerts"
        />

        <StatCard
          icon={<Activity />}
          label="Detection"
          value="ONLINE"
          sub="Rules engine operational"
          online
        />

      </section>


      <section className="content-grid">

        <div className="panel incidents-panel">

          <PanelHeader
            title="Active Incidents"
            kicker="SECURITY EVENTS"
          >

            <div className="search-box">

              <Search size={16} />

              <input
                placeholder="Search alerts..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

          </PanelHeader>


          {filteredAlerts.length === 0 ? (

            <EmptyState />

          ) : (

            <div className="incident-list">

              {filteredAlerts.map(
                (alert, index) => (

                  <Incident
                    key={`${alert.source_ip}-${index}`}
                    alert={alert}
                    onClick={() =>
                      openAlert(alert)
                    }
                  />

                )
              )}

            </div>

          )}

        </div>


        <div className="right-column">

          <ThreatCard
            alert={latestAlert}
          />

          <MitreCard
            alert={latestAlert}
          />

        </div>

      </section>

    </>
  );
}


/* =========================
   INCIDENTS PAGE
========================= */

function IncidentsPage({
  alerts,
  search,
  setSearch,
  openAlert,
}) {
  return (
    <section className="page">

      <div className="page-header">

        <div>

          <p className="panel-kicker">
            SECURITY EVENTS
          </p>

          <h3>
            Incident Queue
          </h3>

          <p>
            Detected security incidents
            requiring investigation.
          </p>

        </div>

        <div className="search-box large">

          <Search size={16} />

          <input
            placeholder="Search incidents..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

      </div>


      {alerts.length === 0 ? (

        <EmptyState />

      ) : (

        <div className="full-incident-list">

          {alerts.map((alert, index) => (

            <Incident
              key={`${alert.source_ip}-${index}`}
              alert={alert}
              onClick={() =>
                openAlert(alert)
              }
            />

          ))}

        </div>

      )}

    </section>
  );
}


/* =========================
   THREAT INTEL
========================= */

function ThreatIntelPage({ alerts }) {

  const uniqueIPs = [
    ...new Set(
      alerts
        .map((alert) => alert.source_ip)
        .filter(Boolean)
    ),
  ];

  return (
    <section className="page">

      <div className="page-header">

        <div>

          <p className="panel-kicker">
            THREAT INTELLIGENCE
          </p>

          <h3>
            Indicator Intelligence
          </h3>

          <p>
            Indicators observed by the detection
            engine.
          </p>

        </div>

      </div>


      {uniqueIPs.length === 0 ? (

        <EmptyState />

      ) : (

        <div className="intel-cards">

          {uniqueIPs.map((ip) => {

            const related = alerts.filter(
              (alert) =>
                alert.source_ip === ip
            );

            return (
              <div
                className="intel-card"
                key={ip}
              >

                <div className="intel-card-top">

                  <div className="indicator-icon">
                    <Globe size={22} />
                  </div>

                  <div>

                    <span>
                      IPv4 ADDRESS
                    </span>

                    <strong>
                      {ip}
                    </strong>

                  </div>

                </div>


                <div className="intel-details">

                  <div>
                    <span>
                      REPUTATION
                    </span>

                    <strong className="private">
                      PRIVATE
                    </strong>
                  </div>

                  <div>
                    <span>
                      RISK
                    </span>

                    <strong>
                      10 / 100
                    </strong>
                  </div>

                  <div>
                    <span>
                      RELATED ALERTS
                    </span>

                    <strong>
                      {related.length}
                    </strong>
                  </div>

                </div>


                <p className="intel-context">
                  Private/internal IP address
                </p>

              </div>
            );
          })}

        </div>

      )}

    </section>
  );
}


/* =========================
   AI PAGE
========================= */

function AIPage({
  alerts,
  openAlert,
}) {
  return (
    <section className="page">

      <div className="ai-banner">

        <div className="ai-banner-icon">
          <BrainCircuit size={35} />
        </div>

        <div>

          <span>
            AI INVESTIGATION ENGINE
          </span>

          <h3>
            Qwen 2.5
          </h3>

          <p>
            Local AI-assisted security
            investigation powered by Ollama.
          </p>

        </div>

        <div className="connected-badge">
          <CheckCircle2 size={15} />
          CONNECTED
        </div>

      </div>


      <div className="page-header">

        <div>

          <p className="panel-kicker">
            INVESTIGATIONS
          </p>

          <h3>
            Available Alerts
          </h3>

        </div>

      </div>


      {alerts.length === 0 ? (

        <EmptyState />

      ) : (

        <div className="ai-alert-grid">

          {alerts.map((alert, index) => (

            <button
              className="ai-alert-card"
              key={index}
              onClick={() =>
                openAlert(alert)
              }
            >

              <div className="ai-alert-icon">
                <BrainCircuit size={23} />
              </div>

              <div>

                <strong>
                  {alert.type}
                </strong>

                <p>
                  {alert.description}
                </p>

                <span>
                  Run Qwen investigation
                </span>

              </div>

              <ChevronRight />

            </button>

          ))}

        </div>

      )}

    </section>
  );
}


/* =========================
   ASSETS
========================= */

function AssetsPage() {

  const assets = [
    {
      name: "server-01",
      type: "Linux Server",
      status: "MONITORED",
      icon: <Server />,
    },
    {
      name: "ssh-server",
      type: "SSH Service",
      status: "MONITORED",
      icon: <Terminal />,
    },
    {
      name: "SOC Backend",
      type: "FastAPI",
      status: "ONLINE",
      icon: <Cpu />,
    },
    {
      name: "Qwen AI",
      type: "Local AI Engine",
      status: "CONNECTED",
      icon: <BrainCircuit />,
    },
  ];

  return (
    <section className="page">

      <div className="page-header">

        <div>

          <p className="panel-kicker">
            SYSTEM
          </p>

          <h3>
            Monitored Assets
          </h3>

          <p>
            Systems and services connected
            to the SOC environment.
          </p>

        </div>

      </div>


      <div className="asset-grid">

        {assets.map((asset) => (

          <div
            className="asset-card"
            key={asset.name}
          >

            <div className="asset-icon">
              {asset.icon}
            </div>

            <div className="asset-info">

              <strong>
                {asset.name}
              </strong>

              <span>
                {asset.type}
              </span>

            </div>

            <div className="asset-status">
              <span />
              {asset.status}
            </div>

          </div>

        ))}

      </div>

    </section>
  );
}


/* =========================
   LOG SOURCES
========================= */

function LogSourcesPage() {

  return (
    <section className="page">

      <div className="page-header">

        <div>

          <p className="panel-kicker">
            DATA INGESTION
          </p>

          <h3>
            Log Sources
          </h3>

          <p>
            Sources currently feeding security
            events into the detection engine.
          </p>

        </div>

      </div>


      <div className="log-source-card">

        <div className="log-source-icon">
          <Database size={25} />
        </div>

        <div>

          <strong>
            FastAPI Log Ingestion
          </strong>

          <p>
            POST /logs
          </p>

        </div>

        <div className="source-online">
          <span />
          ONLINE
        </div>

      </div>


      <div className="log-source-card">

        <div className="log-source-icon">
          <Wifi size={25} />
        </div>

        <div>

          <strong>
            Security Event Stream
          </strong>

          <p>
            Authentication events
          </p>

        </div>

        <div className="source-online">
          <span />
          READY
        </div>

      </div>

    </section>
  );
}


/* =========================
   COMPONENTS
========================= */

function StatCard({
  icon,
  label,
  value,
  sub,
  danger,
  online,
}) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">

        <span>
          {label}
        </span>

        <strong
          className={
            danger ? "danger-text" : ""
          }
        >
          {value}
        </strong>

        <small
          className={
            online ? "online-text" : ""
          }
        >
          {sub}
        </small>

      </div>

    </div>
  );
}


function PanelHeader({
  title,
  kicker,
  children,
}) {
  return (
    <div className="panel-header">

      <div>

        <p className="panel-kicker">
          {kicker}
        </p>

        <h3>
          {title}
        </h3>

      </div>

      {children}

    </div>
  );
}


function Incident({
  alert,
  onClick,
}) {

  const risk = alert.risk_score || 0;

  return (
    <button
      className="incident"
      onClick={onClick}
    >

      <div className="incident-severity">
        <span />
      </div>

      <div className="incident-main">

        <div className="incident-title">

          <strong>
            {alert.type}
          </strong>

          <span className="severity-badge">
            {alert.severity}
          </span>

        </div>

        <p>
          {alert.description}
        </p>

        <div className="incident-meta">

          <span>
            <Globe size={13} />
            {alert.source_ip}
          </span>

          <span>
            <Server size={13} />
            {alert.username || "unknown"}
          </span>

          <span>
            <Crosshair size={13} />
            {alert.mitre_attack?.technique ||
              "N/A"}
          </span>

        </div>

      </div>

      <div className="risk">

        <span>
          RISK
        </span>

        <strong>
          {risk}
        </strong>

        <div className="risk-bar">
          <i
            style={{
              width: `${risk}%`,
            }}
          />
        </div>

      </div>

      <ChevronRight
        size={18}
        className="incident-arrow"
      />

    </button>
  );
}


function ThreatCard({ alert }) {

  return (
    <div className="panel threat-panel">

      <PanelHeader
        kicker="THREAT INTELLIGENCE"
        title="Latest Indicator"
      >
        <Globe size={20} />
      </PanelHeader>


      {alert ? (

        <>
          <div className="indicator">

            <div className="indicator-icon">
              <Globe size={22} />
            </div>

            <div>

              <span>
                IPv4 ADDRESS
              </span>

              <strong>
                {alert.source_ip}
              </strong>

            </div>

          </div>


          <div className="intel-grid">

            <div>

              <span>
                REPUTATION
              </span>

              <strong className="private">
                PRIVATE
              </strong>

            </div>

            <div>

              <span>
                RISK
              </span>

              <strong>
                10 / 100
              </strong>

            </div>

          </div>


          <div className="intel-context">
            Private/internal IP address
          </div>

        </>

      ) : (

        <div className="small-empty">
          No indicators available.
        </div>

      )}

    </div>
  );
}


function MitreCard({ alert }) {

  return (
    <div className="panel mitre-panel">

      <PanelHeader
        kicker="ATT&CK FRAMEWORK"
        title="Technique"
      />

      {alert?.mitre_attack ? (

        <div className="mitre-card">

          <div className="mitre-id">
            {alert.mitre_attack.technique}
          </div>

          <div>

            <strong>
              {alert.mitre_attack.name}
            </strong>

            <p>
              MITRE ATT&CK technique
            </p>

          </div>

        </div>

      ) : (

        <div className="small-empty">
          No MITRE technique detected.
        </div>

      )}

    </div>
  );
}


function EmptyState() {

  return (
    <div className="empty-state">

      <Shield size={42} />

      <h4>
        No active alerts
      </h4>

      <p>
        Your detection engine hasn't
        generated any incidents.
      </p>

    </div>
  );
}


/* =========================
   AI INVESTIGATION MODAL
========================= */

function InvestigationModal({
  selected,
  investigation,
  investigating,
  onClose,
}) {

  const alert = selected.alert;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >

      <div
        className="investigation-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <header className="modal-header">

          <div>

            <div className="ai-label">

              <BrainCircuit size={16} />

              AI INVESTIGATION

            </div>

            <h2>
              {alert.type}
            </h2>

          </div>

          <button
            className="close-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>

        </header>


        <div className="modal-alert">

          <div>
            <span>SOURCE IP</span>
            <strong>
              {alert.source_ip}
            </strong>
          </div>

          <div>
            <span>RISK SCORE</span>
            <strong>
              {alert.risk_score}/100
            </strong>
          </div>

          <div>
            <span>ATTEMPTS</span>
            <strong>
              {alert.attempts}
            </strong>
          </div>

          <div>
            <span>MITRE</span>
            <strong>
              {alert.mitre_attack?.technique}
            </strong>
          </div>

        </div>


        {investigating ? (

          <div className="ai-loading">

            <div className="loader">
              <BrainCircuit size={32} />
            </div>

            <h3>
              Qwen is investigating...
            </h3>

            <p>
              Analyzing alert evidence,
              threat intelligence and
              MITRE ATT&CK context.
            </p>

            <div className="loading-line">
              <span />
            </div>

          </div>

        ) : investigation?.error ? (

          <div className="ai-error">

            <AlertTriangle size={24} />

            <h3>
              Investigation failed
            </h3>

            <p>
              {investigation.error}
            </p>

          </div>

        ) : investigation?.investigation ? (

          <div className="investigation-content">

            <div className="ai-summary">

              <span>
                AI ASSESSMENT
              </span>

              <h3>
                {
                  investigation
                    .investigation
                    .summary
                }
              </h3>

              <div className="confidence">

                <span>
                  CONFIDENCE
                </span>

                <strong>
                  {
                    investigation
                      .investigation
                      .confidence
                  }%
                </strong>

              </div>

            </div>


            <div className="investigation-grid">

              <InfoBlock
                title="Attack Type"
                value={
                  investigation
                    .investigation
                    .attack_type
                }
              />

              <InfoBlock
                title="Severity"
                value={
                  investigation
                    .investigation
                    .severity
                }
              />

              <InfoBlock
                title="MITRE ATT&CK"
                value={`${investigation.investigation.mitre_attack?.technique || ""} — ${
                  investigation.investigation.mitre_attack?.name || ""
                }`}
              />

              <InfoBlock
                title="Assessment"
                value={
                  investigation
                    .investigation
                    .assessment
                }
                wide
              />

            </div>


            <div className="evidence-section">

              <h3>
                Evidence
              </h3>

              <ul>

                {(
                  investigation
                    .investigation
                    .evidence || []
                ).map((item, i) => (

                  <li key={i}>
                    {item}
                  </li>

                ))}

              </ul>

            </div>


            <div className="actions-section">

              <h3>
                Recommended Actions
              </h3>

              <ol>

                {(
                  investigation
                    .investigation
                    .recommended_actions || []
                ).map((item, i) => (

                  <li key={i}>
                    {item}
                  </li>

                ))}

              </ol>

            </div>

          </div>

        ) : (

          <div className="ai-loading">
            <p>
              No investigation data returned.
            </p>
          </div>

        )}

      </div>

    </div>
  );
}


function InfoBlock({
  title,
  value,
  wide,
}) {

  return (
    <div
      className={`info-block ${
        wide ? "wide" : ""
      }`}
    >

      <span>
        {title}
      </span>

      <strong>
        {value || "N/A"}
      </strong>

    </div>
  );
}


/* =========================
   PAGE TITLES
========================= */

function getViewName(view) {

  const names = {
    overview: "OVERVIEW",
    incidents: "INCIDENTS",
    "threat-intel": "THREAT INTEL",
    ai: "AI ANALYSIS",
    assets: "ASSETS",
    logs: "LOG SOURCES",
  };

  return names[view] || "OVERVIEW";
}


function getViewTitle(view) {

  const names = {
    overview: "Security Operations Center",
    incidents: "Security Incidents",
    "threat-intel": "Threat Intelligence",
    ai: "AI Security Analysis",
    assets: "Monitored Assets",
    logs: "Security Log Sources",
  };

  return names[view] || "Security Operations Center";
}


export default App;
