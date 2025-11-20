# Contributing to tanstack-api-generator

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- TypeScript knowledge
- Familiarity with TanStack Query

### Setup

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/tanstack-auto-query-api.git
   cd tanstack-auto-query-api
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Build the project:

   ```bash
   npm run build
   ```

5. Run tests:
   ```bash
   npm test
   ```

## Development Workflow

### Project Structure

```
├── src/                    # Source code
│   ├── index.ts           # Main entry point
│   ├── types.ts           # Type definitions
│   ├── fetcher/           # Fetch wrapper
│   ├── hooks/             # Hook generation
│   ├── keys/              # Query key generation
│   └── invalidation/      # Invalidation utilities
├── examples/              # Example projects
│   └── basic-usage/       # Full working example
├── tests/                 # Test files
└── dist/                  # Built output
```

### Making Changes

1. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Build and test:

   ```bash
   npm run build
   npm test
   ```

4. Check TypeScript types:
   ```bash
   npm run type-check
   ```

### Code Style

- Use TypeScript for all code
- Follow existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing

- Write tests for new features
- Ensure all tests pass before submitting
- Aim for high test coverage
- Test edge cases and error conditions

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

```
feat(hooks): add support for custom query options
fix(keys): handle undefined parameters correctly
docs(readme): update installation instructions
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md with your changes
5. Submit a pull request with a clear description

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How has this been tested?

## Checklist

- [ ] Tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No breaking changes (or documented)
```

## Reporting Issues

### Bug Reports

Include:

- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (Node version, React version, etc.)
- Code example if possible

### Feature Requests

Include:

- Clear description of the feature
- Use case and motivation
- Proposed API (if applicable)
- Examples of how it would be used

## Questions and Support

- Check existing issues and documentation first
- Open a GitHub issue for questions
- Be respectful and constructive

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes (for significant contributions)
- README acknowledgments (for major features)

Thank you for contributing! 🎉
