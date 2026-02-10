import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { simpleGit } from "simple-git";

const server = new Server(
    {
        name: "git-commit-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Helper to get the git root or use current directory
 */
const getCwd = (args: any) => args.repoPath || process.cwd();

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "git_status",
                description: "查看工作区状态 (git status)",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "仓库本地路径 (可选)" },
                    },
                },
            },
            {
                name: "git_diff",
                description: "查看代码改动对比 (git diff)",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "仓库本地路径 (可选)" },
                        staged: { type: "boolean", description: "是否查看已暂存区的改动 (git diff --staged)" },
                    },
                },
            },
            {
                name: "git_add",
                description: "添加文件到暂存区 (git add)",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "仓库本地路径 (可选)" },
                        files: { type: "array", items: { type: "string" }, description: "文件路径列表，使用 ['.'] 代表全部" },
                    },
                    required: ["files"],
                },
            },
            {
                name: "git_commit",
                description: "记录代码提交 (git commit)，支持规范化的前缀和中文消息",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "仓库本地路径 (可选)" },
                        type: {
                            type: "string",
                            enum: ["feat", "fix", "style", "refactor", "docs", "chore", "test"],
                            description: "提交类型 (如: feat-功能, fix-修复, style-样式)"
                        },
                        scope: { type: "string", description: "改动范围 (可选，如: ui, api, db)" },
                        message: { type: "string", description: "提交说明信息 (支持中文)" },
                        push: { type: "boolean", description: "提交成功后是否自动执行 git push (可选)" },
                    },
                    required: ["type", "message"],
                },
            },
            {
                name: "git_push",
                description: "推送代码到远程仓库 (git push)",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "仓库本地路径 (可选)" },
                        remote: { type: "string", description: "远程仓库名 (默认为 origin)" },
                        branch: { type: "string", description: "分支名" },
                    },
                },
            },
            {
                name: "git_pull",
                description: "从远程仓库拉取更新 (git pull)",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "仓库本地路径 (可选)" },
                        remote: { type: "string", description: "远程仓库名 (默认为 origin)" },
                        branch: { type: "string", description: "分支名" },
                    },
                },
            },
            {
                name: "git_log",
                description: "查看提交历史日志 (git log)",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "仓库本地路径 (可选)" },
                        count: { type: "number", description: "显示的提交条数", default: 5 },
                    },
                },
            },
        ],
    };
});

/**
 * Handler for tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const repoPath = getCwd(args);
    const localGit = simpleGit(repoPath);

    try {
        // Validation: Verify if the directory is a git repository
        const isRepo = await localGit.checkIsRepo();
        if (!isRepo) {
            throw new Error(`Directory "${repoPath}" is not a valid git repository.`);
        }

        switch (name) {
            case "git_status": {
                const status = await localGit.status();
                return {
                    content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
                };
            }

            case "git_diff": {
                const options = (args as any).staged ? ["--staged"] : [];
                const diff = await localGit.diff(options);
                return {
                    content: [{ type: "text", text: diff || "No changes detected." }],
                };
            }

            case "git_add": {
                const files = (args as any).files;
                await localGit.add(files);
                return {
                    content: [{ type: "text", text: `Successfully added: ${files.join(", ")}` }],
                };
            }

            case "git_commit": {
                const type = (args as any).type;
                const scope = (args as any).scope;
                const message = (args as any).message;
                const push = (args as any).push;
                const fullMessage = scope ? `${type}(${scope}): ${message}` : `${type}: ${message}`;
                const result = await localGit.commit(fullMessage);

                let pushResult = "";
                if (push) {
                    try {
                        const pushOutput = await localGit.push();
                        pushResult = `\nPush successful: ${JSON.stringify(pushOutput)}`;
                    } catch (pushError: any) {
                        pushResult = `\nPush failed: ${pushError.message}`;
                    }
                }

                return {
                    content: [{ type: "text", text: `Commit successful: ${result.commit}\nSummary: ${JSON.stringify(result.summary)}${pushResult}` }],
                };
            }

            case "git_push": {
                const remote = (args as any).remote || "origin";
                const branch = (args as any).branch;
                const result = await localGit.push(remote, branch);
                return {
                    content: [{ type: "text", text: `Push successful: ${JSON.stringify(result)}` }],
                };
            }

            case "git_pull": {
                const remote = (args as any).remote || "origin";
                const branch = (args as any).branch;
                const result = await localGit.pull(remote, branch);
                return {
                    content: [{ type: "text", text: `Pull successful: ${JSON.stringify(result.summary)}` }],
                };
            }

            case "git_log": {
                const count = (args as any).count || 5;
                const log = await localGit.log({ maxCount: count });
                const text = log.all.map(c => `${c.date} [${c.hash.substring(0, 7)}] ${c.message}`).join("\n");
                return {
                    content: [{ type: "text", text: text || "No log found." }],
                };
            }

            default:
                throw new Error(`Tool not found: ${name}`);
        }
    } catch (error: any) {
        return {
            isError: true,
            content: [{ type: "text", text: `Error: ${error.message}` }],
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Git Commit MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
