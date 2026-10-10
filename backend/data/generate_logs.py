"""
Synthetic log generator for Real-Time Security Incident Triager.
Produces normal web traffic logs and injected attacks.
"""

import argparse
import json
import random
import time
from datetime import datetime, timedelta, timezone

# Templates for normal traffic
NORMAL_TEMPLATES = [
    '192.168.1.{ip} - - [{date}] "GET /index.html HTTP/1.1" 200 {bytes}',
    '192.168.1.{ip} - - [{date}] "GET /assets/style.css HTTP/1.1" 200 {bytes}',
    '192.168.1.{ip} - - [{date}] "GET /api/v1/status HTTP/1.1" 200 {bytes}',
    '10.0.0.{ip} - - [{date}] "POST /api/v1/metrics HTTP/1.1" 201 {bytes}',
    '10.0.0.{ip} - - [{date}] "GET /dashboard HTTP/1.1" 200 {bytes}',
    '172.16.0.{ip} - - [{date}] "GET /favicon.ico HTTP/1.1" 200 {bytes}',
]

# Attack templates
ATTACK_TEMPLATES = {
    "sql_injection": [
        '203.0.113.{ip} - - [{date}] "GET /api/users?id=1%20UNION%20SELECT%20username,password%20FROM%20users HTTP/1.1" 403 {bytes} - "SQL Injection Detected"',
        '203.0.113.{ip} - - [{date}] "POST /login HTTP/1.1" 401 {bytes} - "Failed password for admin: \' OR \'1\'=\'1"',
    ],
    "brute_force": [
        '198.51.100.{ip} - - [{date}] "POST /api/auth HTTP/1.1" 401 {bytes} - "invalid user root"',
        '198.51.100.{ip} - - [{date}] "POST /api/auth HTTP/1.1" 401 {bytes} - "login failed"',
    ],
    "port_scan": [
        '198.51.100.{ip} - - [{date}] "OPTIONS * HTTP/1.0" 400 0 - "Nmap scripting engine"',
        '198.51.100.{ip} - - [{date}] "GET / HTTP/1.1" 404 0 - "connection refused"',
    ],
    "xss": [
        '203.0.113.{ip} - - [{date}] "GET /search?q=<script>alert(1)</script> HTTP/1.1" 403 {bytes} - "XSS Attempt"',
    ],
}

def generate_logs(count: int = 5000, attack_ratio: float = 0.05) -> list[dict]:
    """
    Generate synthetic logs.
    Returns a list of dicts with 'raw_log' and 'is_attack'.
    """
    logs = []
    base_time = datetime.now(timezone.utc) - timedelta(days=1)
    
    for i in range(count):
        # Random time progression
        base_time += timedelta(seconds=random.randint(1, 15))
        date_str = base_time.strftime("%d/%b/%Y:%H:%M:%S +0000")
        
        is_attack = random.random() < attack_ratio
        
        if is_attack:
            attack_type = random.choice(list(ATTACK_TEMPLATES.keys()))
            template = random.choice(ATTACK_TEMPLATES[attack_type])
            log_str = template.format(
                ip=random.randint(1, 254),
                date=date_str,
                bytes=random.randint(50, 500)
            )
            logs.append({
                "raw_log": log_str,
                "is_attack": True,
                "attack_type": attack_type
            })
        else:
            template = random.choice(NORMAL_TEMPLATES)
            log_str = template.format(
                ip=random.randint(1, 254),
                date=date_str,
                bytes=random.randint(500, 5000)
            )
            logs.append({
                "raw_log": log_str,
                "is_attack": False,
                "attack_type": "none"
            })
            
    return logs

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=100)
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()
    
    logs = generate_logs(count=args.count)
    if args.preview:
        for log in logs[:20]:
            print(f"[{'ATTACK' if log['is_attack'] else 'NORMAL'}] {log['raw_log']}")
        print(f"\nTotal: {len(logs)} logs.")
