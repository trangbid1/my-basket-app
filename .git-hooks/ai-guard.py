#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Guard Pre-Commit Hook
Checks for security violations in staged code using local Ollama AI
"""

import json
import subprocess
import sys
import requests
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Configuration
AI_MODEL = "llama3:latest"  # Change this to your preferred model
OLLAMA_URL = "http://localhost:11434/api/generate"

def get_staged_files():
    """Get list of staged files."""
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only"],
        capture_output=True,
        text=True
    )
    files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
    return files

def get_staged_content(files):
    """Get content of staged files."""
    staged_content = ""
    
    for file in files:
        if not Path(file).exists():
            continue
            
        result = subprocess.run(
            ["git", "show", f":{file}"],
            capture_output=True,
            text=True,
            errors='ignore'
        )
        
        if result.returncode == 0 and result.stdout:
            staged_content += f"\n=== FILE: {file} ===\n{result.stdout}\n"
    
    return staged_content

def create_security_prompt(staged_content):
    """Create the security review prompt."""
    prompt = """You are a security code reviewer. Analyze the following code for security violations.

**CRITICAL RULES:**
1. REJECT if you find hardcoded credentials (passwords, API keys, tokens, secrets) assigned to string variables
2. REJECT if you find hardcoded JWT tokens, bearer tokens, or authentication tokens
3. REJECT if you find hardcoded wait times like waitForTimeout(5000) or sleep()
4. PASS for environment variables (process.env, os.getenv, etc.) - these are safe
5. PASS for empty strings, null, undefined values

**Examples of VIOLATIONS:**
```
const password = "MyPass123";  // REJECT
let apiKey = "sk-abc123";  // REJECT
var token = "eyJhbGc...";  // REJECT
const adminPass = "Production@2024!";  // REJECT
waitForTimeout(5000);  // REJECT
```

**Examples of SAFE code:**
```
const password = process.env.PASSWORD;  // PASS
const apiKey = "";  // PASS
let token = null;  // PASS
```

**YOUR TASK:**
Respond ONLY with:
- "REJECT: <reason>" if you find ANY violation
- "PASS" if the code is safe

**CODE TO REVIEW:**
"""
    return prompt + staged_content

def call_ollama_api(prompt):
    """Call Ollama API for security analysis."""
    payload = {
        "model": AI_MODEL,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        print("[!] AI Guard Warning: Ollama API not responding (ensure Ollama is running)")
        return None
    except requests.exceptions.Timeout:
        print("[!] AI Guard Warning: Ollama API timeout")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"[!] AI Guard Warning: HTTP error - {e}")
        print("[!] Check if Ollama is running and the model is available")
        return None
    except Exception as e:
        print(f"[!] AI Guard Warning: API error - {e}")
        return None

def main():
    # 1. Get staged files
    staged_files = get_staged_files()
    if not staged_files:
        sys.exit(0)  # No changes, proceed
    
    # 2. Get staged content
    staged_content = get_staged_content(staged_files)
    if not staged_content.strip():
        sys.exit(0)  # No valid content to check
    
    # 3. Create security prompt
    prompt = create_security_prompt(staged_content)
    
    # 4. Call Ollama API
    response = call_ollama_api(prompt)
    if not response:
        sys.exit(0)  # Fail open
    
    # 5. Extract and process result
    result = response.get('response', '').strip()
    if not result:
        print("[!] AI Guard Warning: Could not parse AI response")
        sys.exit(0)  # Fail open
    
    # 6. Enforce security decision
    print()
    if result.upper().startswith("REJECT"):
        print("[X] AI GUARD BLOCKED COMMIT")
        print("=" * 60)
        print(result)
        print("=" * 60)
        print()
        print("Fix the security issues above before committing.")
        sys.exit(1)  # Block commit
    else:
        print("[OK] AI Guard: Security check passed")
        sys.exit(0)  # Allow commit

if __name__ == "__main__":
    main()
