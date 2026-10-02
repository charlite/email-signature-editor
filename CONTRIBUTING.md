# Contributing to Email Signature Editor

First off, thank you for considering contributing to Email Signature Editor! 🎉

This project helps users create and edit HTML email signatures with a live preview, ready for copy-paste into Gmail. Your contributions help make it better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/charlite/email-signature-editor/issues) to avoid duplicates. When you create a bug report, please
include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (Node.js version, OS, browser, etc.)
- **Code samples** or screenshots if applicable

### 🚀 Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear title and description** of the enhancement
- **Use case** explaining why this would be useful
- **Possible implementation** if you have ideas
- **Examples** of how it would work

### 📝 Improving Documentation

Documentation improvements are always welcome:

- Fix typos or grammar issues
- Add missing examples
- Improve setup instructions
- Add troubleshooting guides

### 🔧 Code Contributions

#### Features

- New signature templates
- UI/UX improvements
- i18n translations (new languages)
- Accessibility enhancements

#### Technical

- Performance optimizations
- Build and tooling improvements
- Code refactoring

## Development Setup

### Prerequisites

- Node.js 18+
- npm 8+
- Git

### Setup Steps

1. **Fork and Clone**

   ```bash
   git clone https://github.com/charlite/email-signature-editor.git
   cd email-signature-editor
   ```

2. **Install Dependencies**

   ```bash
   npm install --legacy-peer-deps
   ```

3. **Run Development Server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Run Checks**

   ```bash
   npm run build
   npm run lint
   npm run typecheck
   ```

### Project Structure

```
├── src/
│   ├── App.tsx              # Main editor UI
│   ├── main.tsx             # Entry point
│   ├── components/ui/       # shadcn components
│   ├── templates/           # Signature templates
│   │   ├── default.ts       # Default template
│   │   └── index.ts         # Template registry
│   ├── i18n/                # Translations (en, es)
│   ├── lib/                 # Utilities
│   └── utils/               # Highlight, etc.
├── .github/                 # GitHub workflows and templates
└── docs/                    # Documentation
```

### Code Style

We use ESLint and Prettier for code formatting:

- **Linting**: `npm run lint`
- **Auto-fix**: `npm run lint:fix`
- **Format**: `npm run format`

## Pull Request Process

### Before Submitting

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the style guidelines
   - Update documentation as needed

3. **Test your changes**

   ```bash
   npm run build
   npm run lint
   npm run typecheck
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Format

We follow [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

**Examples:**

```
feat: add new signature template
fix: resolve preview height in vertical layout
docs: update README with production URL
chore: update dependencies
```

### Pull Request Guidelines

1. **Fill out the PR template** completely
2. **Link related issues** using "Closes #123"
3. **Update documentation** if needed
4. **Ensure CI passes** (lint, typecheck, build)
5. **Request review** from maintainers

### Review Process

- **Automated checks** must pass
- **At least one maintainer** must approve
- **No unresolved conversations** should remain
- **Squash and merge** is preferred

## Style Guidelines

### TypeScript

- Use strict TypeScript configuration
- Export types and interfaces
- Use meaningful variable names

### Code Structure

- Keep functions small and focused
- Use async/await over promises
- Handle errors gracefully
- Write self-documenting code

### Documentation

- Use clear, concise language
- Include code examples
- Update README for new features
- Add inline comments for complex logic

## Community

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/charlite/email-signature-editor/issues)
- **Pull Requests**: [Submit contributions](https://github.com/charlite/email-signature-editor/pulls)

### Recognition

Contributors will be recognized in:

- README.md
- CHANGELOG.md release notes
- GitHub releases (when applicable)

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to Email Signature Editor! 🚀

**Happy coding!** 💻✨
