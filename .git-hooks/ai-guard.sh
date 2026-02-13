#!/bin/sh
# AI Guard Pre-Commit Hook
# Checks for security violations in staged code using local Ollama AI

# Configuration
AI_MODEL="llama3-groq-tool-use:latest"
OLLAMA_URL="http://localhost:11434/api/generate"

# 1. Capture Staged Changes
staged_files=$(git diff --cached --name-only)
if [ -z "$staged_files" ]; then
    exit 0  # No changes, proceed
fi

# Get full content of staged files
staged_content=""
for file in $staged_files; do
    if [ -f "$file" ]; then
        content=$(git show :"$file" 2>/dev/null)
        if [ $? -eq 0 ]; then
            staged_content="${staged_content}

=== FILE: $file ===
${content}
"
        fi
    fi
done

if [ -z "$staged_content" ]; then
    exit 0  # No valid content to check
fi

# 2. Create Security Prompt (save to temp file to avoid JSON escaping issues)
TEMP_PROMPT=$(mktemp)
cat > "$TEMP_PROMPT" << 'PROMPT_END'
You are a security code reviewer. Analyze the following code for security violations.

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
PROMPT_END

echo "$staged_content" >> "$TEMP_PROMPT"

# 3. Create JSON payload with proper escaping
TEMP_JSON=$(mktemp)
python3 -c "
import json
import sys

with open('$TEMP_PROMPT', 'r') as f:
    prompt = f.read()

payload = {
    'model': '$AI_MODEL',
    'prompt': prompt,
    'stream': False
}

json.dump(payload, sys.stdout)
" > "$TEMP_JSON" 2>/dev/null

# Check if JSON creation succeeded
if [ $? -ne 0 ] || [ ! -s "$TEMP_JSON" ]; then
    echo "⚠️  AI Guard Warning: Could not create JSON payload (Python required)"
    rm -f "$TEMP_PROMPT" "$TEMP_JSON"
    exit 0  # Fail open
fi

# 4. Call Ollama API
response=$(curl -s -X POST "$OLLAMA_URL" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_JSON" 2>/dev/null)

# Cleanup temp files
rm -f "$TEMP_PROMPT" "$TEMP_JSON"

# Check if API call succeeded
if [ -z "$response" ]; then
    echo "⚠️  AI Guard Warning: Ollama API not responding (ensure Ollama is running)"
    exit 0  # Fail open
fi

# Extract response
result=$(echo "$response" | python3 -c "
import json
import sys

try:
    data = json.load(sys.stdin)
    print(data.get('response', '').strip())
except:
    print('')
" 2>/dev/null)

# 5. Enforce Security Decision
if [ -z "$result" ]; then
    echo "⚠️  AI Guard Warning: Could not parse AI response"
    exit 0  # Fail open
fi

echo ""
if echo "$result" | grep -qi "^REJECT"; then
    echo "🚫 AI GUARD BLOCKED COMMIT"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$result"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Fix the security issues above before committing."
    exit 1  # Block commit
else
    echo "✅ AI Guard: Security check passed"
    exit 0  # Allow commit
fi
