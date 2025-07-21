# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/ad349429-8dc7-4f28-98fd-4b71357efc2b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ad349429-8dc7-4f28-98fd-4b71357efc2b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev

# Additional development commands:
npm run lint        # Check code quality with ESLint
npm run lint:fix    # Fix ESLint issues automatically
npm run format      # Format code with Prettier
npm run build       # Create production build
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React 18** - UI framework
- **shadcn-ui** - Component library
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Backend as a service
- **ESLint + Prettier** - Code quality and formatting
- **Husky** - Pre-commit hooks for code quality

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ad349429-8dc7-4f28-98fd-4b71357efc2b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Development Workflow

This project uses automated code quality tools:

- **Pre-commit hooks**: Code is automatically linted and formatted before commits
- **ESLint**: Catches code quality issues and enforces consistent patterns
- **Prettier**: Ensures consistent code formatting across the project
- **Husky**: Manages Git hooks to run quality checks

When you commit changes, the following will run automatically:
1. ESLint will check and fix TypeScript/React files
2. Prettier will format all staged files
3. Only clean, formatted code will be committed
