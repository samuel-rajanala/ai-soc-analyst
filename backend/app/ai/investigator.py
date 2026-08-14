import json
import requests


class AIInvestigator:

    def __init__(
        self,
        model="qwen2.5:7b",
        ollama_url="http://127.0.0.1:11434/api/generate",
    ):
        self.model = model
        self.ollama_url = ollama_url

    def investigate(self, alert, threat_intel=None):

        prompt = f"""
You are an AI Junior SOC Analyst.

Analyze the following security alert.

SECURITY ALERT:
{json.dumps(alert, indent=2)}

THREAT INTELLIGENCE:
{json.dumps(threat_intel, indent=2)}

Your job is to investigate the alert and provide a concise SOC-style assessment.

Return ONLY valid JSON using exactly this structure:

{{
  "summary": "Short explanation of what happened",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "confidence": 0,
  "attack_type": "Type of attack",
  "mitre_attack": {{
    "technique": "MITRE technique ID",
    "name": "MITRE technique name"
  }},
  "evidence": [
    "Important evidence 1",
    "Important evidence 2"
  ],
  "assessment": "Explain why this is or is not suspicious",
  "recommended_actions": [
    "Action 1",
    "Action 2",
    "Action 3"
  ]
}}

Rules:

1. Do not invent evidence.
2. Base your assessment only on the supplied alert and threat intelligence.
3. Confidence must be a number between 0 and 100.
4. Keep the response concise.
5. Return JSON only.
"""

        response = requests.post(
            self.ollama_url,
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.2
                },
            },
            timeout=120,
        )

        response.raise_for_status()

        data = response.json()

        raw_response = data.get("response", "")

        try:
            return json.loads(raw_response)

        except json.JSONDecodeError:

            return {
                "summary": raw_response,
                "severity": alert.get(
                    "severity",
                    "UNKNOWN",
                ),
                "confidence": 0,
                "attack_type": alert.get(
                    "type",
                    "Unknown",
                ),
                "mitre_attack": alert.get(
                    "mitre_attack",
                    {},
                ),
                "evidence": [
                    alert.get(
                        "description",
                        "No evidence available.",
                    )
                ],
                "assessment": (
                    "The AI returned a response "
                    "that could not be parsed as JSON."
                ),
                "recommended_actions": [
                    "Review the alert manually.",
                    "Check the source IP.",
                    "Review related authentication logs.",
                ],
            }
