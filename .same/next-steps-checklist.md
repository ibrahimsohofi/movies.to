# Next Steps Checklist for CI/CD

## ✅ Completed
- [x] Fixed ECONNREFUSED errors in frontend tests
- [x] Excluded e2e files from unit test runner
- [x] Added backend test dependencies installation
- [x] Fixed Codecov token authentication
- [x] Updated security scan to stable versions
- [x] Switched to SQLite for simpler CI setup

## 🔧 Required Actions (Do These Next)

### 1. Add GitHub Repository Secrets
Navigate to: **Repository Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets:

#### Required:
- [ ] **CODECOV_TOKEN**
  - Get from: https://codecov.io (after connecting your repository)
  - Purpose: Upload test coverage reports

#### Already Configured (verify these exist):
- [ ] **VITE_TMDB_API_KEY** - Should already be set to `0f22aa77cc9fc284b4d3b9445375f0a2`

#### Optional (for full functionality):
- [ ] **MYSQL_ROOT_PASSWORD** - MySQL password for CI (defaults to 'rootpass' if not set)
- [ ] **NETLIFY_AUTH_TOKEN** - For automated deployments
- [ ] **NETLIFY_SITE_ID** - For automated deployments
- [ ] **SNYK_TOKEN** - For security scanning (optional)

### 2. Test the CI/CD Pipeline

```bash
# Step 1: Commit the changes
git add .
git commit -m "fix: CI/CD pipeline improvements

- Fix ECONNREFUSED by starting preview server before tests
- Exclude e2e from unit test runner to prevent Playwright conflicts
- Add MySQL service container for backend tests
- Add backend test dependencies installation
- Fix Codecov authentication with token
- Update security scan to stable action versions"

# Step 2: Push to a feature branch first (recommended)
git checkout -b fix/ci-pipeline
git push origin fix/ci-pipeline

# Step 3: Create a Pull Request to trigger CI
# Go to GitHub and create PR from fix/ci-pipeline to main/develop
```

### 3. Monitor the First CI Run

Watch for these specific improvements:
- [ ] Frontend tests should complete without ECONNREFUSED errors
- [ ] No "Playwright Test did not expect test.describe()" errors
- [ ] Backend tests should install dependencies successfully
- [ ] Codecov upload should work (if token is set)
- [ ] Security scan should use stable action version

### 4. If Issues Occur

#### Preview server not starting:
- Check the "Wait for preview server" step logs
- May need to increase timeout from 30 to 60 seconds
- Verify build step completed successfully

#### Unit tests still failing:
```bash
# Test locally first:
bun run test:run
# Should NOT load any files from e2e/ directory
```

#### Backend tests failing:
- Check if supertest and @jest/globals installed correctly
- Verify SQLite database initialized
- Review test logs for specific errors

#### Codecov still failing:
- Verify CODECOV_TOKEN secret is set correctly
- Check if token has correct permissions
- Review Codecov action logs

### 5. Long-term Improvements (Optional)

After CI is stable, consider:

- [ ] **Mock network calls in unit tests**
  - Prevents need for preview server
  - Faster test execution
  - More reliable tests

- [ ] **Migrate backend tests to Vitest**
  - Consistent test runner across project
  - Better ESM support
  - Faster execution

- [ ] **Add test mocking for TMDB API**
  - Don't hit real API in tests
  - Consistent test data
  - Faster tests

- [ ] **Setup GitHub branch protection**
  - Require CI to pass before merge
  - Require code review
  - Auto-merge when approved + tests pass

## 📚 Reference Documentation

- **CI Workflow**: `.github/workflows/ci.yml`
- **Test Config**: `vite.config.ts`
- **Fix Summary**: `.same/ci-fixes-summary.md`
- **Backend Config**: `backend/package.json`

## 🆘 Troubleshooting

### CI keeps failing?
1. Check individual job logs in GitHub Actions
2. Look for the first error (not cascading failures)
3. Test the same commands locally
4. Review the fix summary document

### Need help?
- Review `.same/ci-fixes-summary.md` for detailed explanations
- Check GitHub Actions logs for specific error messages
- Test commands locally before debugging in CI

## ✨ Success Criteria

You'll know everything is working when:
1. ✅ All CI jobs show green checkmarks
2. ✅ No ECONNREFUSED errors in frontend tests
3. ✅ No Playwright/Vitest conflicts
4. ✅ Backend tests run successfully
5. ✅ Coverage reports upload to Codecov
6. ✅ Security scans complete without errors

---

**Current Status:** 🟡 Ready for testing - Add secrets and push to trigger CI
