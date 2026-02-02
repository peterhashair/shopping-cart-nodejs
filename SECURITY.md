# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it by creating a private security advisory on GitHub or by emailing the maintainers directly.

## Recent Security Fixes

### Fixed in Latest Version

#### Critical Issues
1. **Lock Key Mismatch (Fixed)** - Corrected inconsistent lock keys in cart operations that could allow race conditions
2. **Race Condition in Stock Management (Fixed)** - Cart is now saved before decrementing product stock to prevent stock loss
3. **SQL Injection Risk (Fixed)** - Replaced string interpolation with parameterized queries in abandoned cart cleanup
4. **Input Validation (Fixed)** - Added maximum quantity validation to prevent DoS attacks

#### High Priority Issues  
1. **Integer Overflow Protection (Fixed)** - Added validation to prevent order total overflow
2. **Error Handling (Improved)** - Replaced console.error with proper NestJS logger
3. **Bootstrap Error Handling (Fixed)** - Added proper error handling for application startup
4. **Unused Dependencies (Fixed)** - Removed mysql2 to reduce attack surface

#### Configuration Issues
1. **Database Synchronize (Improved)** - Changed to explicit whitelist of environments instead of blacklist
2. **Product Pagination (Added)** - Added pagination to prevent DoS from large product lists

### Known Limitations

#### Type Safety Issues
- **Redlock Type Assertions**: The project uses `as any` type assertions for Redlock v5.0.0-beta.2
  - This is a temporary workaround for type compatibility issues
  - Recommendation: Upgrade to stable Redlock v5.x when available or use Redlock v4.x with proper types

#### Missing Security Features
- **No CSRF Protection**: Cookie-based sessions are vulnerable to CSRF attacks
  - Recommendation: Implement CSRF tokens for state-changing operations
  - Mitigation: Ensure SameSite cookie attribute is set to 'strict' in production

- **No Rate Limiting**: API endpoints are not protected against brute force or flooding
  - Recommendation: Implement rate limiting using @nestjs/throttler
  - Critical for: cart operations, checkout, product creation

- **No Idempotency Keys**: Checkout operations are not idempotent
  - Risk: Duplicate requests could create duplicate orders
  - Recommendation: Implement transaction IDs or idempotency keys

#### Operational Concerns
- **Redis Failure Handling**: Application will fail if Redis is unavailable
  - No circuit breaker or fallback mechanism
  - Recommendation: Implement graceful degradation or circuit breaker pattern

- **Abandoned Cart Logic**: Items are automatically deleted after 5 minutes
  - Could delete items from active shopping sessions
  - Recommendation: Increase timeout or implement "activity" tracking

## Security Best Practices

### Environment Configuration
1. **Never commit secrets** - Use environment variables for all credentials
2. **Change default passwords** - Update database and Redis credentials in production
3. **Set NODE_ENV properly** - Must be 'production' in production environments
4. **Enable secure cookies** - Set `app.cookieSecure=true` in production
5. **Use strict SameSite** - Set `app.cookieSameSite=strict` in production

### Deployment Checklist
- [ ] Update all default credentials
- [ ] Set NODE_ENV=production
- [ ] Enable secure cookies (HTTPS only)
- [ ] Configure CORS for specific origin (not wildcard)
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerting
- [ ] Regular security audits with `npm audit`
- [ ] Keep dependencies updated
- [ ] Review and rotate secrets regularly

### Database Security
- **Use migrations in production** - Never enable `synchronize: true`
- **Principle of least privilege** - Database user should have minimum required permissions
- **Regular backups** - Implement automated backup strategy
- **Connection pooling** - Configure appropriate pool sizes

### Dependencies
- **Regular updates** - Run `npm audit` regularly and update dependencies
- **Beta versions** - Replace beta dependencies (currently: redlock@5.0.0-beta.2)
- **Minimal dependencies** - Only include necessary packages

## Security Contact

For security concerns, please contact the repository maintainers through GitHub's security advisory feature.

## Acknowledgments

Security improvements based on comprehensive code review and industry best practices.
