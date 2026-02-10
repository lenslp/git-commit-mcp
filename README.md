# Git Commit MCP Server

This MCP server provides tools for managing Git repositories, specifically optimized for AI assistants to handle code staging and commits with high-quality descriptions.

## Tools

### 1. `git_status`
Shows the current status of the working tree (staged, unstaged, untracked files).

### 2. `git_diff`
Shows changes in the working directory or staged area.
- **Arguments**:
  - `staged` (boolean): If true, shows the diff of what is already staged. Essential for AI to write commit messages.

### 3. `git_add`
Stages specific files or all changes.
- **Arguments**:
  - `files` (string[]): List of files to add. Use `["."]` for all changes.

### 4. `git_commit`
Records changes to the repository with a provided message and a conventional prefix.
- **Arguments**:
  - `type` (string): The type of change (e.g., `feat`, `fix`, `style`, `refactor`).
  - `message` (string): The commit message (the prefix will be added automatically).

### 5. `git_log`
Shows the recent commit history.
- **Efficiency Hint**: AI uses this to learn the project's commit message style (e.g., Emoji, prefix, tone).

## Installation

```bash
npm install
npm run build
```

## How to use with Antigravity / Claude

Add this to your configuration:

```json
{
  "mcpServers": {
    "git-mcp": {
      "command": "node",
      "args": ["/Users/nongzhang/Documents/web3-study/作业练习/mcp-demo/build/index.js"]
    }
  }
}
```

## Integrated Workflow for Efficiency
1. **Understand changes**: AI calls `git_status` and `git_diff --staged`.
2. **Learn style**: AI calls `git_log` to see previous messages.
3. **Commit**: AI generates and executes `git_commit` with a professional, contextual message.
