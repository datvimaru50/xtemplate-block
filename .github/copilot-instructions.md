# Project General Coding Guidelines

## Code Style
- Use semantic HTML5 elements (header, main, section, article, etc.)
- Prefer modern JavaScript (ES6+) features like `const`/`let`, arrow functions, and template literals
- Follow TypeScript best practices for type safety and clarity

## Naming Conventions
- Use PascalCase for component names, interfaces, and type aliases
- Use camelCase for variables, functions, and methods
- Prefix private class members with an underscore (_)
- Use ALL_CAPS for constants

## Code Quality
- Use meaningful variable and function names that clearly describe their purpose
- Include helpful comments for complex logic
- Add error handling for user inputs and API calls

## Project-Specific Guidelines

### Architecture Overview
- The project is a VS Code extension for parsing `<!-- BEGIN: name -->` and `<!-- END: name -->` blocks into symbols, folding ranges, and hover abilities.
- The main entry point is `src/extension.ts`, which handles activation events and extension lifecycle.
- Core functionality is implemented in `src/xtemplate.ts`.
- Tests are located in `src/test/` and `src/test_2/`.

### Developer Workflows
- **Build**: Run `npm run compile` to build the project using Webpack.
- **Watch**: Use `npm run watch` to enable Webpack's watch mode for development.
- **Test**: Execute `npm test` to run tests using `vscode-test`. Ensure the `pretest` script is successful to compile and lint the code before testing.
- **Lint**: Run `npm run lint` to check for code quality issues.

### Testing
- Tests are written in TypeScript and located in `src/test/` and `src/test_2/`.
- Use `provideDocumentSymbols.test.ts`, `provideFoldingRanges.test.ts`, and `provideHover.test.ts` as examples for writing new tests.
- Ensure tests cover edge cases for parsing and folding logic.

### Integration Points
- The extension activates on `onLanguage:html` events.
- External dependencies include `@vscode/test-electron` for testing and `webpack` for bundling.

### Patterns and Conventions
- Follow the existing test structure for consistency.
- Use Webpack for bundling and TypeScript for type safety.
- Keep the `media/` directory for assets like icons and GIFs.

### Key Files
- `src/extension.ts`: Entry point for the extension.
- `src/xtemplate.ts`: Core logic for parsing and folding.
- `package.json`: Defines scripts, dependencies, and activation events.
- `webpack.config.js`: Configuration for Webpack bundling.

### Additional Notes
- Ensure compatibility with VS Code version `^1.98.0` as specified in `package.json`.
- Use `@types/vscode` for type definitions when interacting with the VS Code API.
