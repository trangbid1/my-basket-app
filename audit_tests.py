#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Auditor - Uses AI Guard logic to audit all test files
Checks for security violations and bad practices in test files
"""

import json
import glob
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

def find_test_files():
    """Find all test files in the workspace, excluding node_modules."""
    import os
    
    test_files = []
    
    # Specific directories to search
    search_dirs = ['tests', 'microservices']
    
    for search_dir in search_dirs:
        if not os.path.exists(search_dir):
            continue
            
        for root, dirs, files in os.walk(search_dir):
            # Skip node_modules directories
            if 'node_modules' in root:
                continue
                
            for file in files:
                if file.endswith(('.test.ts', '.test.js', '.spec.ts', '.spec.js')):
                    test_files.append(os.path.join(root, file))
    
    # Remove duplicates and sort
    test_files = sorted(set(test_files))
    return test_files

def read_file_content(file_path):
    """Read content of a file."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception as e:
        print(f"[!] Error reading {file_path}: {e}")
        return None

def create_security_prompt(file_path, content):
    """Create the security review prompt."""
    prompt = """You are a security code reviewer. Analyze the following test file for security violations and bad practices.

**CRITICAL RULES:**
1. REJECT if you find hardcoded credentials (passwords, API keys, tokens, secrets) assigned to string variables
2. REJECT if you find hardcoded JWT tokens, bearer tokens, or authentication tokens
3. REJECT if you find hardcoded wait times like waitForTimeout(5000) or sleep()
4. PASS for environment variables (process.env, os.getenv, etc.) - these are safe
5. PASS for empty strings, null, undefined values
6. PASS for mock/test data that is clearly fake (e.g., "test@example.com", "fake-token-123")

**Examples of VIOLATIONS:**
```
const password = "MyPass123";  // REJECT
let apiKey = "sk-abc123";  // REJECT
var token = "eyJhbGc...";  // REJECT
const adminPass = "Production@2024!";  // REJECT
await page.waitForTimeout(5000);  // REJECT
```

**Examples of SAFE code:**
```
const password = process.env.PASSWORD;  // PASS
const apiKey = "";  // PASS
let token = null;  // PASS
const mockEmail = "test@example.com";  // PASS (clearly fake test data)
```

**YOUR TASK:**
Respond ONLY with:
- "REJECT: <reason>" if you find ANY violation
- "PASS" if the code is safe

**TEST FILE TO REVIEW:**
FILE: """ + file_path + """

"""
    return prompt + content

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
            timeout=60
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        print("[!] ERROR: Ollama API not responding")
        print("[!] Please ensure Ollama is running with: ollama serve")
        return None
    except requests.exceptions.Timeout:
        print("[!] ERROR: Ollama API timeout (60s)")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"[!] ERROR: HTTP error - {e}")
        print("[!] Check if Ollama is running and the model is available")
        return None
    except Exception as e:
        print(f"[!] ERROR: API error - {e}")
        return None

def main():
    print("=" * 80)
    print("TEST FILE SECURITY AUDIT")
    print("=" * 80)
    print()
    
    # 1. Find all test files
    test_files = find_test_files()
    
    if not test_files:
        print("[!] No test files found")
        return 0
    
    print(f"[*] Found {len(test_files)} test file(s) to audit:")
    for f in test_files:
        print(f"    - {f}")
    print()
    
    # 2. Audit each test file
    issues_found = []
    passed_files = []
    
    for i, file_path in enumerate(test_files, 1):
        print(f"[{i}/{len(test_files)}] Auditing: {file_path}")
        
        # Read file content
        content = read_file_content(file_path)
        if not content:
            print("    [!] Could not read file, skipping")
            continue
        
        # Create security prompt
        prompt = create_security_prompt(file_path, content)
        
        # Call Ollama API
        response = call_ollama_api(prompt)
        if not response:
            print("    [!] API call failed, skipping")
            continue
        
        # Extract and process result
        result = response.get('response', '').strip()
        if not result:
            print("    [!] Could not parse AI response, skipping")
            continue
        
        # Check result
        if result.upper().startswith("REJECT"):
            print(f"    [X] ISSUES FOUND")
            issues_found.append({
                'file': file_path,
                'reason': result
            })
        else:
            print(f"    [✓] PASSED")
            passed_files.append(file_path)
        
        print()
    
    # 3. Summary
    print("=" * 80)
    print("AUDIT SUMMARY")
    print("=" * 80)
    print(f"Total files audited: {len(test_files)}")
    print(f"Files passed: {len(passed_files)}")
    print(f"Files with issues: {len(issues_found)}")
    print()
    
    if issues_found:
        print("=" * 80)
        print("ISSUES FOUND:")
        print("=" * 80)
        for issue in issues_found:
            print(f"\nFile: {issue['file']}")
            print("-" * 80)
            print(issue['reason'])
            print()
    else:
        print("[✓] All test files passed the security audit!")
    
    return 1 if issues_found else 0

if __name__ == "__main__":
    sys.exit(main())
