# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to **security@buildworks.ai**.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution**: Depends on severity and complexity

### Severity Levels

- **Critical**: Remote code execution, authentication bypass, data breach
- **High**: Privilege escalation, sensitive data exposure
- **Medium**: Information disclosure, denial of service
- **Low**: Minor security improvements

## Security Best Practices

### For Users

- Keep dependencies updated
- Use strong passwords
- Rotate API tokens regularly
- Enable rate limiting in production
- Use HTTPS in production
- Review security headers configuration

### For Developers

- Never commit secrets or credentials
- Use environment variables for configuration
- Validate all user inputs
- Use parameterized queries (SQLModel handles this)
- Encrypt sensitive data at rest
- Follow `.cursor/rules/08-auth-security.mdc` guidelines

## Security Features

- **Token Encryption**: All API tokens encrypted at rest
- **Session Security**: HTTP-only cookies, Redis-backed sessions
- **Input Validation**: Pydantic models for all inputs
- **Rate Limiting**: Per-user/IP rate limiting support
- **Security Headers**: CSP, HSTS, X-Frame-Options
- **Error Handling**: No sensitive information in error messages

## Known Security Considerations

- Default credentials are for development only
- Change `SECRET_KEY` in production
- Configure CORS properly for production
- Enable HTTPS redirect in production
- Review and configure security headers

## Disclosure Policy

- Vulnerabilities will be disclosed after a fix is available
- Credit will be given to reporters (if desired)
- CVE numbers will be requested for critical vulnerabilities

---

**For security concerns, contact:** security@buildworks.ai

