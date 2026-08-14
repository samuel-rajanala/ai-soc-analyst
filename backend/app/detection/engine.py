from collections import defaultdict
from datetime import datetime, timedelta


class DetectionEngine:

    def __init__(self):
        self.failed_logins = defaultdict(list)
        self.active_incidents = {}

    def analyze(self, event: dict):
        alerts = []

        if event.get("event") != "failed_login":
            return alerts

        source_ip = event.get("source_ip")

        if not source_ip:
            return alerts

        now = datetime.fromisoformat(
            event["timestamp"].replace("Z", "+00:00")
        )

        # Store failed login
        self.failed_logins[source_ip].append(now)

        # Only keep events from the last 5 minutes
        cutoff = now - timedelta(minutes=5)

        self.failed_logins[source_ip] = [
            timestamp
            for timestamp in self.failed_logins[source_ip]
            if timestamp >= cutoff
        ]

        attempts = len(self.failed_logins[source_ip])

        # Brute-force threshold
        if attempts >= 5:

            # Existing incident
            if source_ip in self.active_incidents:

                incident = self.active_incidents[source_ip]

                incident["attempts"] = attempts
                incident["risk_score"] = min(
                    50 + attempts * 5,
                    100
                )

                incident["description"] = (
                    f"{attempts} failed login attempts detected "
                    f"from {source_ip} within 5 minutes."
                )

                return []

            # New incident
            alert = {
                "type": "SSH Brute Force",
                "severity": "HIGH",
                "risk_score": min(
                    50 + attempts * 5,
                    100
                ),
                "source_ip": source_ip,
                "username": event.get("username"),
                "attempts": attempts,
                "mitre_attack": {
                    "technique": "T1110",
                    "name": "Brute Force"
                },
                "description": (
                    f"{attempts} failed login attempts detected "
                    f"from {source_ip} within 5 minutes."
                )
            }

            self.active_incidents[source_ip] = alert

            alerts.append(alert)

        return alerts
