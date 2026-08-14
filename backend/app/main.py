from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.detection.engine import DetectionEngine
from backend.app.ai.investigator import AIInvestigator


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="AI Junior SOC Analyst",
    version="0.1.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ENGINES
# ============================================================

detection_engine = DetectionEngine()
ai_investigator = AIInvestigator()


# ============================================================
# STORAGE
# ============================================================

alerts: list[dict[str, Any]] = []
logs: list[dict[str, Any]] = []


# ============================================================
# MODELS
# ============================================================

class SecurityLog(BaseModel):
    timestamp: str
    source_ip: str
    destination: Optional[str] = None
    username: Optional[str] = None
    event: str
    status: Optional[str] = None
    device: Optional[str] = None


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "name": "AI Junior SOC Analyst",
        "status": "online",
        "version": "0.1.0",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "alerts": len(alerts),
        "logs": len(logs),
        "ai": {
            "provider": "Ollama",
            "model": ai_investigator.model,
            "status": "connected",
        },
    }


# ============================================================
# LOG INGESTION
# ============================================================

@app.post("/logs")
def ingest_log(event: SecurityLog):

    event_data = event.model_dump()

    logs.append(event_data)

    generated_alerts = detection_engine.analyze(event_data)

    if generated_alerts:
        alerts.extend(generated_alerts)

    return {
        "status": "processed",
        "event": event_data,
        "alerts_generated": generated_alerts,
    }


# ============================================================
# GET LOGS
# ============================================================

@app.get("/logs")
def get_logs():
    return {
        "count": len(logs),
        "logs": logs,
    }


# ============================================================
# GET ALERTS
# ============================================================

@app.get("/alerts")
def get_alerts():
    return {
        "count": len(alerts),
        "alerts": alerts,
    }


# ============================================================
# GET SINGLE ALERT
# ============================================================

@app.get("/alerts/{alert_id}")
def get_alert(alert_id: int):

    if alert_id < 0 or alert_id >= len(alerts):
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    return {
        "alert_id": alert_id,
        "alert": alerts[alert_id],
    }


# ============================================================
# THREAT INTELLIGENCE
# ============================================================

@app.get("/threat-intel/{indicator}")
def threat_intel(indicator: str):

    # Basic local/private IP classification.
    # We intentionally don't claim external reputation here.

    if (
        indicator.startswith("10.")
        or indicator.startswith("192.168.")
        or indicator.startswith("172.16.")
        or indicator.startswith("172.17.")
        or indicator.startswith("172.18.")
        or indicator.startswith("172.19.")
        or indicator.startswith("172.20.")
        or indicator.startswith("172.21.")
        or indicator.startswith("172.22.")
        or indicator.startswith("172.23.")
        or indicator.startswith("172.24.")
        or indicator.startswith("172.25.")
        or indicator.startswith("172.26.")
        or indicator.startswith("172.27.")
        or indicator.startswith("172.28.")
        or indicator.startswith("172.29.")
        or indicator.startswith("172.30.")
        or indicator.startswith("172.31.")
    ):
        return {
            "indicator": indicator,
            "indicator_type": "ipv4",
            "reputation": "PRIVATE",
            "risk_score": 10,
            "context": "Private/internal IP address",
        }

    return {
        "indicator": indicator,
        "indicator_type": "ipv4",
        "reputation": "UNKNOWN",
        "risk_score": 50,
        "context": "No external threat-intelligence provider configured",
    }


# ============================================================
# AI INVESTIGATION
# ============================================================

@app.get("/alerts/{alert_id}/investigate")
def investigate_alert(alert_id: int):

    if alert_id < 0 or alert_id >= len(alerts):
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    alert = alerts[alert_id]

    source_ip = alert.get("source_ip")

    threat_intelligence = None

    if source_ip:
        threat_intelligence = threat_intel(source_ip)

    try:

        investigation = ai_investigator.investigate(
            alert=alert,
            threat_intel=threat_intelligence,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=f"AI investigation failed: {str(exc)}",
        )

    return {
        "alert_id": alert_id,
        "alert": alert,
        "threat_intelligence": threat_intelligence,
        "investigation": investigation,
    }


# ============================================================
# RESET LAB DATA
# ============================================================

@app.delete("/reset")
def reset_data():

    alerts.clear()
    logs.clear()

    detection_engine.failed_logins.clear()
    detection_engine.active_incidents.clear()

    return {
        "status": "reset",
        "message": "SOC lab data cleared",
    }
