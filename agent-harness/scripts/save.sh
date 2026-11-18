#!/usr/bin/env bash
# Commits test-page logs and eval results, and pushes them to GitHub.
git add logs results
if git diff --cached --quiet; then
  echo "Nothing new to save."
  exit 0
fi
git commit -q -m "Save sessions and eval results" && git push -q && echo "Saved to GitHub."
