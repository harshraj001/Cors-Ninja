# Contributing to CORS Ninja

Thank you for considering contributing to CORS Ninja! This document outlines the process for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:
- A clear description of the bug
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)
- Environment details (browser, OS, etc.)

### Suggesting Features

For feature requests, create an issue with:
- A clear description of the feature
- How this feature would benefit users
- Any implementation ideas you might have

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test your changes thoroughly
5. Submit a pull request with a clear description of the changes

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/cors-ninja.git
cd cors-ninja

# Install dependencies
npm install

# Run locally
npm run start
```

## Working with KV Namespaces

For rate limiting functionality, you'll need to set up a KV namespace:

1. Create a KV namespace in the Cloudflare dashboard
2. In your Worker settings, add a KV namespace binding with the variable name `RATE_LIMIT_STORE`
3. For local development, add the binding to your wrangler.toml

## Coding Standards

- Follow the existing code style
- Add JSDoc comments to new functions
- Ensure your code passes all tests

## License

By contributing to CORS Ninja, you agree that your contributions will be licensed under the project's MIT License.
