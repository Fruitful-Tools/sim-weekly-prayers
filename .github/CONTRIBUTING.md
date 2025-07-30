# Contributing to SIM Weekly Prayer

Thank you for your interest in contributing to SIM Weekly Prayer! This document provides guidelines and instructions to help you get started.

For a comprehensive overview of the project, tech stack, and features, please see our [main README](../README.md).

**Join Discussion**: <https://discord.gg/hnQrfUvFk3>

## Getting Started

### 1. Create an Issue First

Before starting any work, please create an issue to discuss your planned changes:

1. **Check existing issues**: Search through [existing issues](https://github.com/schwannden/sim-weekly-prayers/issues) to see if your idea or bug report already exists
2. **Create a new issue**: If no existing issue covers your topic, create a new one:
   - **For bugs**: Use the bug report template and provide clear reproduction steps
   - **For features**: Use the feature request template and describe the proposed functionality
   - **For documentation**: Describe what documentation needs to be added or improved
3. **Wait for discussion**: Allow maintainers and community members to discuss the issue before starting work
4. **Get assignment**: Wait for a maintainer to assign the issue to you before beginning development

This process helps avoid duplicate work and ensures your contribution aligns with the project's goals.

### 2. Fork and Create Pull Request

Once you have an assigned issue:

1. **Fork the repository**: Click the "Fork" button on the [main repository page](https://github.com/schwannden/sim-weekly-prayers)

2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR-USERNAME/sim-weekly-prayers.git
   cd sim-weekly-prayers
   ```

3. **Add upstream remote** (to keep your fork updated):

   ```bash
   git remote add upstream https://github.com/schwannden/sim-weekly-prayers.git
   ```

4. **Follow the development workflow** (detailed below) to make your changes

5. **Create a Pull Request**:
   - Push your changes to your fork
   - Go to your fork on GitHub and click "New Pull Request"
   - Reference the issue number in your PR description (e.g., "Closes #123")
   - Provide a clear description of what your PR does

## Prerequisites

- [Node.js](https://nodejs.org/) (we recommend using Volta for version management)
  - [Volta](https://volta.sh/) - for consistent Node.js and npm versions
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) - to start supabase and setup all databases locally.
- (Optional) [Cursor](https://cursor.sh/) - recommended IDE as our project has specific Cursor configurations, we have specific Cursor configurations in the `.cursor/rules/` directory that help maintain consistent development practices.

## Setting Up Volta

We use Volta to ensure consistent Node.js and npm versions across the development team:

```bash
# Install Volta
curl https://get.volta.sh | bash

# Install Node.js through Volta
volta install node
```

## Running SIM Weekly Prayer Locally

After forking and cloning the repository (see "Getting Started" section above):

### Setup Local Supabase (First Time)

1. `supabase start`

### Start Frontend

1. Create a `.env.local` file with your local Supabase credentials:

   ```bash
   # Extract Supabase URL
   echo "VITE_SUPABASE_URL=http://localhost:54321" > .env.local

   # Extract and add Supabase anon key
   echo "VITE_SUPABASE_ANON_KEY=$(supabase status | grep "anon key:" | awk '{print $3}')" >> .env.local
   ```

2. Install dependencies: `npm install --legacy-peer-deps`
3. Setup husky: `npm prepare`
4. Start the development server: `npm run dev`

## Contribution Involving DB Migration

After testing is done properly in local db, we need to generate migration,
see [Official Docs](https://supabase.com/docs/reference/cli/supabase-db) for more comprehensive guide.

1. `supabase link --project-ref cbqslwwonnlkvblpvyrc`
2. `supabase db diff -f supabase/migrations/{timesyamp}_{meaningfulname}.sql`
3. remember to commit the migration file together with your pr.

## Development Workflow

1. Create a new branch:

   ```bash
   git checkout -b {type}/{pr-name}
   ```

   type should be one of `feat`/`fix`/`build`/`chore`/`refactor`/`docs`/`test`, depending on your task type.

2. Make your changes

3. Run tests and linting before committing:

   ```bash
   npm run format
   npm run lint:fix
   npm run test
   ```

   **Testing Guidelines:**

   - All RLS (Row Level Security) policies must be tested
   - Run `npm run test:rls` to run only RLS-specific tests
   - For detailed testing documentation, patterns, and best practices, see our [Test Documentation](../tests/README.md)

4. Commit your changes using [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) messages.

   ```text
   <type>: <short summary>
   ```

   Examples:

   - `feat: add new prayer entry feature`
   - `fix: resolve bug in edit prayer form`
   - Refer to [release please config](https://github.com/schwannden/sim-weekly-prayers/blob/main/release-please-config.json#L12) for more types.

## Pull Request Process

When you're ready to submit your changes:

1. **Ensure your branch is up to date**:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks locally**:

   ```bash
   npm run format
   npm run lint:fix
   npm run test
   ```

3. **Push to your fork**:

   ```bash
   git push origin your-branch-name
   ```

4. **Create the Pull Request**:
   - Go to your fork on GitHub and click "New Pull Request"
   - **Title**: Use a clear, descriptive title that follows conventional commit format
   - **Description**:
     - Reference the issue number (e.g., "Closes #123" or "Fixes #456")
     - Describe what your PR does and why
     - Include any breaking changes or migration notes
     - Add screenshots for UI changes

5. **Required for merge**:
   - Link to the related issue
   - All CI/CD checks must pass
   - Update documentation if applicable (README.md, etc.)
   - Update package.json version if applicable (for releases)
   - At least one maintainer approval

6. **After submission**:
   - A maintainer will review your PR and may request changes
   - Address any feedback by pushing new commits to your branch
   - Once approved, a maintainer will merge your PR

## Code Style

This project uses:

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

The configuration for these tools is defined in:

- `eslint.config.js`
- `.prettierrc`

Following these guidelines helps keep the codebase clean and maintainable.

## License

By contributing to SIM Weekly Prayer, you agree that your contributions will be licensed under the project's license.
