import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { simpleGit, SimpleGit } from "simple-git";
import * as path from "path";

// Initialize simple-git
const git: SimpleGit = simpleGit();

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
                description: "Show the working tree status",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "Path to the git repository" },
                    },
                },
            },
            {
                name: "git_diff",
                description: "Show changes in the working directory or staged area",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "Path to the git repository" },
                        staged: { type: "boolean", description: "Show diff of staged changes" },
                    },
                },
            },
            {
                name: "git_add",
                description: "Add file contents to the index",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "Path to the git repository" },
                        files: { type: "array", items: { type: "string" }, description: "Files to add. Use ['.'] for all." },
                    },
                    required: ["files"],
                },
            },
            {
                name: "git_commit",
                description: "Record changes to the repository with a prefix (feat, fix, style, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "Path to the git repository" },
                        type: {
                            type: "string",
                            enum: ["feat", "fix", "style", "refactor", "docs", "chore", "test"],
                            description: "The type of change (e.g., feat, fix, style)"
                        },
                        message: { type: "string", description: "The commit message (without prefix)" },
                    },
                    required: ["type", "message"],
                },
            },
            {
                name: "git_log",
                description: "Show commit logs (useful for learning project commit style)",
                inputSchema: {
                    type: "object",
                    properties: {
                        repoPath: { type: "string", description: "Path to the git repository" },
                        count: { type: "number", description: "Number of commits to show", default: 5 },
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
                const message = (args as any).message;
                const fullMessage = `${type}: ${message}`;
                const result = await localGit.commit(fullMessage);
                return {
                    content: [{ type: "text", text: `Commit successful: ${result.commit}\nSummary: ${JSON.stringify(result.summary)}` }],
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
