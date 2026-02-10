# Git Commit MCP 服务器

这是一个支持 Model Context Protocol (MCP) 的 Git 操作服务器，专为 AI 助手（如 Claude、Antigravity）优化，旨在实现高质量、规范化的代码提交工作流。

## 核心功能 (Tools)

### 1. `git_status`
查看当前工作区的状态（包括已暂存、未暂存和未追踪的文件）。

### 2. `git_diff`
查看代码的具体改动。
- **参数**:
  - `staged` (boolean): 如果为 `true`，则显示已暂存区的改动。这是 AI 生成提交信息的关键依据。

### 3. `git_add`
将文件变动添加到暂存区。
- **参数**:
  - `files` (string[]): 待添加的文件列表。使用 `["."]` 可添加所有变动。

### 4. `git_commit`
记录代码提交，并自动应用规范化前缀。
- **参数**:
  - `type` (string): 提交类型（如 `feat`, `fix`, `style`, `refactor` 等）。
  - `scope` (string, 可选): 改动范围（如 `ui`, `core`）。
  - `message` (string): 提交说明信息（支持中文）。

### 5. `git_push`
将本地提交推送到远程仓库。
- **参数**:
  - `remote` (string, 可选): 默认值为 `origin`。
  - `branch` (string, 可选): 要推送的分支名。

### 6. `git_pull`
从远程仓库拉取并集成更新。
- **参数**:
  - `remote` (string, 可选): 默认值为 `origin`。
  - `branch` (string, 可选): 要拉取的分支名。

### 7. `git_log`
查看最近的提交历史。AI 会以此学习项目的提交风格（如语言习惯、Emoji、语气等）。

## 安装指南

```bash
npm install
npm run build
```

## 在 Antigravity / Claude Desktop 中配置

将以下配置添加到您的 `claude_desktop_config.json` 文件中：

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

## 高效工作流示例
1. **分析改动**：AI 调用 `git_status` 和 `git_diff --staged`。
2. **学习风格**：AI 调用 `git_log` 获取历史记录。
3. **安全提交**：AI 生成并执行 `git_commit`，提供专业且具有上下文的中文提交说明。
