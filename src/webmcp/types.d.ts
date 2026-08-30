export {};

declare global {
  interface WebMcpToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations?: {
      readOnlyHint?: boolean;
      destructiveHint?: boolean;
      idempotentHint?: boolean;
      openWorldHint?: boolean;
    };
    execute: (input: unknown) => unknown | Promise<unknown>;
  }

  interface WebMcpModelContext {
    registerTool: (
      tool: WebMcpToolDefinition,
      options?: { signal?: AbortSignal },
    ) => Promise<void>;
  }

  interface Document {
    modelContext?: WebMcpModelContext;
  }
}
