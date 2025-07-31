# Contributing to Campus Market 🎓🛒

Thank you for your interest in contributing to Campus Market! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Before You Start

1. **Check existing issues** - Look through [existing issues](https://github.com/yourusername/Campus-Market/issues) to see if your idea has already been discussed.
2. **Read the documentation** - Make sure you understand the project structure and coding standards.
3. **Join the community** - Introduce yourself in the [Discussions](https://github.com/yourusername/Campus-Market/discussions) section.

### Types of Contributions

We welcome contributions in the following areas:

- 🐛 **Bug fixes** - Help us squash bugs and improve stability
- ✨ **New features** - Add new functionality to enhance the platform
- 📚 **Documentation** - Improve docs, add examples, or clarify existing content
- 🎨 **UI/UX improvements** - Enhance the user interface and experience
- 🧪 **Testing** - Add tests or improve test coverage
- 🔧 **Performance** - Optimize code for better performance
- 🌐 **Localization** - Add translations for new languages

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm, yarn, or pnpm
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   # Clone your fork
   git clone https://github.com/yourusername/Campus-Market.git
   cd Campus-Market
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your Firebase configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Code Style

- **TypeScript** - All new code should be written in TypeScript
- **ESLint** - Follow the project's ESLint configuration
- **Prettier** - Use Prettier for code formatting
- **Conventional Commits** - Use conventional commit messages

### File Naming

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

### Component Structure

```typescript
// ComponentName.tsx
import React from 'react'
import { ComponentProps } from './types'

interface ComponentNameProps {
  // Define props
}

export function ComponentName({ ...props }: ComponentNameProps) {
  return (
    // JSX
  )
}
```

### Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for good test coverage

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update documentation** - If you're adding new features, update relevant docs
2. **Add tests** - Include tests for new functionality
3. **Check linting** - Run `npm run lint` and fix any issues
4. **Test locally** - Ensure everything works on your machine

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other (please describe)

## Testing
- [ ] Added tests for new functionality
- [ ] All existing tests pass
- [ ] Tested locally

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Added comments for complex code
- [ ] Updated documentation
- [ ] No console errors or warnings
```

### Review Process

1. **Automated checks** - CI/CD will run tests and linting
2. **Code review** - Maintainers will review your PR
3. **Address feedback** - Make requested changes
4. **Merge** - Once approved, your PR will be merged

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Safari, Firefox]
- Version: [e.g. 22]

## Additional Context
Any other context, screenshots, or logs
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other approaches you considered

## Additional Context
Any other context, mockups, or examples
```

## 🏷️ Issue Labels

We use the following labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issues
- `priority: low` - Low priority issues

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and general discussion
- **Email** - For security issues: security@campusmarke.co.zw

## 🎉 Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributor hall of fame

## 📄 License

By contributing to Campus Market, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Campus Market! 🎓🛒 