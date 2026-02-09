# CLAUDE.md — AI Assistant Guide for SHLEMUT

## Project Overview

**SHLEMUT** is a newly initialized repository. This file serves as the primary reference for AI assistants working on this codebase.

## Repository State

- **Status**: Empty / newly initialized — no source code, build configuration, or documentation exists yet
- **Remote**: `origin` points to a Git server at the configured proxy
- **Default branch**: To be established with the first commit

## Development Workflow

### Branch Naming

- Feature branches follow the pattern: `claude/<descriptor>-<session-id>`
- Always push with: `git push -u origin <branch-name>`

### Commit Conventions

- Use clear, descriptive commit messages
- Focus on the "why" rather than the "what"
- Keep the first line under 72 characters

### Getting Started

Since this is a new repository, the first contributions should establish:

1. A `.gitignore` appropriate for the chosen tech stack
2. Project scaffolding (build config, dependency manifest, etc.)
3. A README.md describing the project purpose and setup instructions
4. CI/CD configuration if applicable

## Key Conventions for AI Assistants

- **Read before modifying**: Always read existing files before suggesting changes
- **Minimal changes**: Only make changes that are directly requested or clearly necessary
- **No over-engineering**: Avoid adding features, abstractions, or "improvements" beyond what was asked
- **Security first**: Do not introduce command injection, XSS, SQL injection, or other OWASP top 10 vulnerabilities
- **No secrets in commits**: Never commit `.env` files, credentials, API keys, or other sensitive data
- **Test your changes**: Run the project's test suite after making changes (once one is established)

## File Structure

```
SHLEMUT/
├── .git/          # Git repository metadata
└── CLAUDE.md      # This file — AI assistant guide
```

> **Note**: Update this section as the project structure evolves.

## Build & Test Commands

> **Note**: No build system or test framework has been configured yet. Update this section when they are established.

<!--
Template for future use:

### Build
```sh
# e.g., npm run build, make, cargo build
```

### Test
```sh
# e.g., npm test, pytest, cargo test
```

### Lint
```sh
# e.g., npm run lint, flake8, clippy
```

### Format
```sh
# e.g., npm run format, black ., cargo fmt
```
-->
