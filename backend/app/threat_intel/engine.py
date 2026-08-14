from ipaddress import ip_address


class ThreatIntelEngine:

    def analyze_ip(self, ip: str) -> dict:
        try:
            parsed = ip_address(ip)

            if parsed.is_private:
                reputation = "PRIVATE"
                risk = 10
                context = "Private/internal IP address"
            else:
                reputation = "UNKNOWN"
                risk = 30
                context = "Public IP requiring further investigation"

            return {
                "indicator": ip,
                "indicator_type": "ipv4",
                "reputation": reputation,
                "risk_score": risk,
                "context": context,
            }

        except ValueError:
            return {
                "indicator": ip,
                "indicator_type": "unknown",
                "reputation": "INVALID",
                "risk_score": 0,
                "context": "Invalid IP address",
            }
