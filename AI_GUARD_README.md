# AI Guard - Code Quality Audit Tool

## Overview
AI Guard is an automated tool that scans your test files for:
- 🔐 **Hardcoded Secrets**: API keys, passwords, tokens, credentials
- ⚠️ **Bad Test Practices**: `waitForTimeout`, hardcoded sleeps, poor selectors
- 📋 **Technical Debt**: Code smells and maintainability issues

## Quick Start

### 1. Basic Usage
Scan the default configured files:
```bash
python ai_guard.py
```

### 2. Scan a Specific File
Pass a file path as an argument:
```bash
python ai_guard.py tests/cart-page.spec.ts
```

### 3. Scan Multiple Files
Edit `ai_guard.py` and modify the `files_to_scan` list:
```python
files_to_scan = [
    "tests/example-with-issues.spec.ts",
    "tests/cart-page.spec.ts",
    "tests/checkout-process.spec.ts",
]
```

## Features

### Pattern-Based Analysis (No Dependencies)
Works out of the box with basic Python. Detects:
- Common secret patterns (API_KEY, PASSWORD, TOKEN, etc.)
- `waitForTimeout` usage
- `setTimeout` and sleep patterns

### AI-Powered Analysis (Optional)
For advanced analysis, install OpenAI:
```bash
pip install openai
```

Set your API key:
```bash
# Windows PowerShell
$env:OPENAI_API_KEY = "your-api-key-here"

# Linux/Mac
export OPENAI_API_KEY="your-api-key-here"
```

The AI provides:
- More accurate secret detection
- Contextual understanding of bad practices
- Detailed technical debt analysis
- Actionable recommendations

## What It Catches

### ✅ Hardcoded Secrets
```typescript
// ❌ BAD
const API_KEY = "sk-1234567890abcdef";
const PASSWORD = "mySecretPassword123!";
const AUTH_TOKEN = "Bearer eyJhbGci...";
```

### ✅ Bad Wait Patterns
```typescript
// ❌ BAD - waitForTimeout
await page.waitForTimeout(5000);

// ✅ GOOD - Conditional wait
await page.waitForSelector('[data-testid="element"]', { state: 'visible' });
await expect(page.locator('[data-testid="element"]')).toBeVisible();
```

### ✅ Hardcoded Sleeps
```typescript
// ❌ BAD
await new Promise(resolve => setTimeout(resolve, 3000));

// ✅ GOOD
await page.waitForLoadState('networkidle');
```

## Output Example

```
╔════════════════════════════════════════════════════════════════════╗
║              AI Guard - Code Quality Audit Tool                    ║
║        Detecting Secrets, Bad Practices & Technical Debt           ║
╚════════════════════════════════════════════════════════════════════╝

🔍 Scanning file: tests/example-with-issues.spec.ts
📊 Analyzing with AI...

======================================================================
🔍 AI Guard Audit Report: tests/example-with-issues.spec.ts
======================================================================

🔐 SECRETS DETECTED (3)
  [HIGH] Line 7: POTENTIAL_SECRET
      → Possible hardcoded secret: const API_KEY = "sk-1234567890..."

⚠️  BAD PRACTICES DETECTED (8)
  [MEDIUM] Line 13: WAIT_FOR_TIMEOUT
      → Using waitForTimeout is a bad practice. Use waitFor with conditions instead.

======================================================================
Summary: Found 3 potential secrets and 8 bad practices
======================================================================

⚠️  Total issues found: 11
```

## Integration with CI/CD

Add to your GitHub Actions or CI pipeline:

```yaml
- name: Run AI Guard
  run: python ai_guard.py
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Configuration

### Modify Scanned Files
Edit the `files_to_scan` list in `main()`:
```python
files_to_scan = [
    "tests/example-with-issues.spec.ts",
    "tests/*.spec.ts",  # Add patterns
]
```

### Adjust Severity Levels
Modify the analysis prompts in `analyze_with_ai()` method to focus on specific issues.

## Best Practices

1. **Run Before Commits**: Catch issues before they reach version control
2. **Integrate in CI**: Automated checks on every pull request
3. **Regular Audits**: Weekly scans of test suite
4. **Team Reviews**: Use reports in code review sessions

## Troubleshooting

### Script finds too many false positives
- Adjust the pattern matching in `fallback_analysis()`
- Use AI-powered mode for better accuracy

### No OpenAI API key
- Script falls back to pattern-based analysis automatically
- Set `OPENAI_API_KEY` environment variable for AI features

### File not found errors
- Use relative paths from the project root
- Check file paths in `files_to_scan` list

## Example Files

See `tests/example-with-issues.spec.ts` for examples of what the tool detects.

## License
MIT
