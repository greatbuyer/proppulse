---
description: Check and update npm dependencies, fix vulnerabilities, and verify build still passes
---

# Update Dependencies Workflow

## Steps

1. Check for outdated packages:
```
cmd /c "npm outdated"
```

2. Review the output and decide which packages to update. Major version bumps may have breaking changes.

3. Update packages (patch and minor only for safety):
```
cmd /c "npm update"
```

4. Fix known vulnerabilities:
```
cmd /c "npm audit fix"
```

5. Verify the build still passes:
```
cmd /c "npm run build"
```

6. If build passes, commit and push:
```
git add -A && git commit -m update-dependencies && git push origin main
```

7. Report results to the user.
