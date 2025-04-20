#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Type definitions for tool arguments
interface ListChannelsArgs {
  limit?: number;
  cursor?: string;
}

interface PostMessageArgs {
  channel_id: string;
  text: string;
}

interface ReplyToThreadArgs {
  channel_id: string;
  thread_ts: string;
  text: string;
}

interface AddReactionArgs {
  channel_id: string;
  timestamp: string;
  reaction: string;
}

interface GetChannelHistoryArgs {
  channel_id: string;
  limit?: number;
}

interface GetThreadRepliesArgs {
  channel_id: string;
  thread_ts: string;
}

interface GetUsersArgs {
  cursor?: string;
  limit?: number;
}

interface GetUserProfileArgs {
  user_id: string;
}

// Tool definitions
const listChannelsTool: Tool = {
  name: "slack_list_channels",
  description: "workspace의 public 또는 pre-defined된 채널을 페이지네이션과 함께 목록으로 표시",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description:
          "반환할 최대 채널 수 (기본값 100, 최대 200)",
        default: 100,
      },
      cursor: {
        type: "string",
        description: "다음 페이지 결과를 위한 페이지네이션 커서",
      },
    },
  },
};

const postMessageTool: Tool = {
  name: "slack_post_message",
  description: "Slack 채널에 새 메시지 게시",
  inputSchema: {
    type: "object",
    properties: {
      channel_id: {
        type: "string",
        description: "메시지를 게시할 채널의 ID",
      },
      text: {
        type: "string",
        description: "게시할 메시지 내용",
      },
    },
    required: ["channel_id", "text"],
  },
};

const replyToThreadTool: Tool = {
  name: "slack_reply_to_thread",
  description: "Slack에서 특정 메시지 스레드에 답장",
  inputSchema: {
    type: "object",
    properties: {
      channel_id: {
        type: "string",
        description: "스레드가 포함된 채널의 ID",
      },
      thread_ts: {
        type: "string",
        description: "parent 메시지의 타임스탬프(형식: '1234567890.123456'). 점이 없는 경우 뒤 6자리에 점을 추가하여 변환 가능.",
      },
      text: {
        type: "string",
        description: "답장할 메시지 내용",
      },
    },
    required: ["channel_id", "thread_ts", "text"],
  },
};

const addReactionTool: Tool = {
  name: "slack_add_reaction",
  description: "메시지에 이모지 반응 추가",
  inputSchema: {
    type: "object",
    properties: {
      channel_id: {
        type: "string",
        description: "반응을 추가할 메시지가 있는 채널의 ID",
      },
      timestamp: {
        type: "string",
        description: "반응을 추가할 메시지의 타임스탬프",
      },
      reaction: {
        type: "string",
        description: "이모지 반응의 이름(콜론 없이 입력)",
      },
    },
    required: ["channel_id", "timestamp", "reaction"],
  },
};

const getChannelHistoryTool: Tool = {
  name: "slack_get_channel_history",
  description: "채널에서 최근 메시지 가져오기",
  inputSchema: {
    type: "object",
    properties: {
      channel_id: {
        type: "string",
        description: "메시지를 가져올 채널의 ID",
      },
      limit: {
        type: "number",
        description: "가져올 메시지 개수 (기본값 10)",
        default: 10,
      },
    },
    required: ["channel_id"],
  },
};

const getThreadRepliesTool: Tool = {
  name: "slack_get_thread_replies",
  description: "메시지 스레드의 모든 답장 가져오기",
  inputSchema: {
    type: "object",
    properties: {
      channel_id: {
        type: "string",
        description: "스레드가 포함된 채널의 ID",
      },
      thread_ts: {
        type: "string",
        description: "parent 메시지의 타임스탬프(형식: '1234567890.123456'). 점이 없는 경우 뒤 6자리에 점을 추가하여 변환 가능.",
      },
    },
    required: ["channel_id", "thread_ts"],
  },
};

const getUsersTool: Tool = {
  name: "slack_get_users",
  description:
    "워크스페이스의 모든 사용자와 기본 프로필 정보 가져오기",
  inputSchema: {
    type: "object",
    properties: {
      cursor: {
        type: "string",
        description: "다음 페이지 결과를 위한 페이지네이션 커서",
      },
      limit: {
        type: "number",
        description: "반환할 최대 사용자 수 (기본값 100, 최대 200)",
        default: 100,
      },
    },
  },
};

const getUserProfileTool: Tool = {
  name: "slack_get_user_profile",
  description: "특정 사용자의 상세 프로필 정보 가져오기",
  inputSchema: {
    type: "object",
    properties: {
      user_id: {
        type: "string",
        description: "사용자의 ID",
      },
    },
    required: ["user_id"],
  },
};

class SlackClient {
  private botHeaders: { Authorization: string; "Content-Type": string };

  constructor(botToken: string) {
    this.botHeaders = {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    };
  }

  async getChannels(limit: number = 100, cursor?: string): Promise<any> {
    const predefinedChannelIds = process.env.SLACK_CHANNEL_IDS;
    if (!predefinedChannelIds) {
      const params = new URLSearchParams({
        types: "public_channel",
        exclude_archived: "true",
        limit: Math.min(limit, 200).toString(),
        team_id: process.env.SLACK_TEAM_ID!,
      });
  
      if (cursor) {
        params.append("cursor", cursor);
      }
  
      const response = await fetch(
        `https://slack.com/api/conversations.list?${params}`,
        { headers: this.botHeaders },
      );
  
      return response.json();
    }

    const predefinedChannelIdsArray = predefinedChannelIds.split(",").map((id: string) => id.trim());
    const channels = [];

    for (const channelId of predefinedChannelIdsArray) {
      const params = new URLSearchParams({
        channel: channelId,
      });

      const response = await fetch(
        `https://slack.com/api/conversations.info?${params}`,
        { headers: this.botHeaders }
      );
      const data = await response.json();

      if (data.ok && data.channel && !data.channel.is_archived) {
        channels.push(data.channel);
      }
    }

    return {
      ok: true,
      channels: channels,
      response_metadata: { next_cursor: "" },
    };
  }

  async postMessage(channel_id: string, text: string): Promise<any> {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: this.botHeaders,
      body: JSON.stringify({
        channel: channel_id,
        text: text,
      }),
    });

    return response.json();
  }

  async postReply(
    channel_id: string,
    thread_ts: string,
    text: string,
  ): Promise<any> {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: this.botHeaders,
      body: JSON.stringify({
        channel: channel_id,
        thread_ts: thread_ts,
        text: text,
      }),
    });

    return response.json();
  }

  async addReaction(
    channel_id: string,
    timestamp: string,
    reaction: string,
  ): Promise<any> {
    const response = await fetch("https://slack.com/api/reactions.add", {
      method: "POST",
      headers: this.botHeaders,
      body: JSON.stringify({
        channel: channel_id,
        timestamp: timestamp,
        name: reaction,
      }),
    });

    return response.json();
  }

  async getChannelHistory(
    channel_id: string,
    limit: number = 10,
  ): Promise<any> {
    const params = new URLSearchParams({
      channel: channel_id,
      limit: limit.toString(),
    });

    const response = await fetch(
      `https://slack.com/api/conversations.history?${params}`,
      { headers: this.botHeaders },
    );

    return response.json();
  }

  async getThreadReplies(channel_id: string, thread_ts: string): Promise<any> {
    const params = new URLSearchParams({
      channel: channel_id,
      ts: thread_ts,
    });

    const response = await fetch(
      `https://slack.com/api/conversations.replies?${params}`,
      { headers: this.botHeaders },
    );

    return response.json();
  }

  async getUsers(limit: number = 100, cursor?: string): Promise<any> {
    const params = new URLSearchParams({
      limit: Math.min(limit, 200).toString(),
      team_id: process.env.SLACK_TEAM_ID!,
    });

    if (cursor) {
      params.append("cursor", cursor);
    }

    const response = await fetch(`https://slack.com/api/users.list?${params}`, {
      headers: this.botHeaders,
    });

    return response.json();
  }

  async getUserProfile(user_id: string): Promise<any> {
    const params = new URLSearchParams({
      user: user_id,
      include_labels: "true",
    });

    const response = await fetch(
      `https://slack.com/api/users.profile.get?${params}`,
      { headers: this.botHeaders },
    );

    return response.json();
  }
}

async function main() {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const teamId = process.env.SLACK_TEAM_ID;

  if (!botToken || !teamId) {
    console.error(
      "SLACK_BOT_TOKEN과 SLACK_TEAM_ID 환경 변수를 설정해주세요",
    );
    process.exit(1);
  }

  console.error("Slack MCP 서버를 시작합니다...");
  const server = new Server(
    {
      name: "kimpalbokTV's slack mcp server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const slackClient = new SlackClient(botToken);

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      console.error("CallToolRequest를 수신했습니다:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("인자가 제공되지 않았습니다");
        }

        switch (request.params.name) {
          case "slack_list_channels": {
            const args = request.params
              .arguments as unknown as ListChannelsArgs;
            const response = await slackClient.getChannels(
              args.limit,
              args.cursor,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "slack_post_message": {
            const args = request.params.arguments as unknown as PostMessageArgs;
            if (!args.channel_id || !args.text) {
              throw new Error(
                "필수 인자(channel_id와 text)가 누락되었습니다",
              );
            }
            const response = await slackClient.postMessage(
              args.channel_id,
              args.text,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "slack_reply_to_thread": {
            const args = request.params
              .arguments as unknown as ReplyToThreadArgs;
            if (!args.channel_id || !args.thread_ts || !args.text) {
              throw new Error(
                "필수 인자(channel_id, thread_ts, text)가 누락되었습니다",
              );
            }
            const response = await slackClient.postReply(
              args.channel_id,
              args.thread_ts,
              args.text,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "slack_add_reaction": {
            const args = request.params.arguments as unknown as AddReactionArgs;
            if (!args.channel_id || !args.timestamp || !args.reaction) {
              throw new Error(
                "필수 인자(channel_id, timestamp, reaction)가 누락되었습니다",
              );
            }
            const response = await slackClient.addReaction(
              args.channel_id,
              args.timestamp,
              args.reaction,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "slack_get_channel_history": {
            const args = request.params
              .arguments as unknown as GetChannelHistoryArgs;
            if (!args.channel_id) {
              throw new Error("필수 인자(channel_id)가 누락되었습니다");
            }
            const response = await slackClient.getChannelHistory(
              args.channel_id,
              args.limit,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "slack_get_thread_replies": {
            const args = request.params
              .arguments as unknown as GetThreadRepliesArgs;
            if (!args.channel_id || !args.thread_ts) {
              throw new Error(
                "필수 인자(channel_id와 thread_ts)가 누락되었습니다",
              );
            }
            const response = await slackClient.getThreadReplies(
              args.channel_id,
              args.thread_ts,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "slack_get_users": {
            const args = request.params.arguments as unknown as GetUsersArgs;
            const response = await slackClient.getUsers(
              args.limit,
              args.cursor,
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "slack_get_user_profile": {
            const args = request.params
              .arguments as unknown as GetUserProfileArgs;
            if (!args.user_id) {
              throw new Error("필수 인자(user_id)가 누락되었습니다");
            }
            const response = await slackClient.getUserProfile(args.user_id);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          default:
            throw new Error(`알 수 없는 도구: ${request.params.name}`);
        }
      } catch (error) {
        console.error("도구 실행 중 오류:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("ListToolsRequest를 수신했습니다");
    return {
      tools: [
        listChannelsTool,
        postMessageTool,
        replyToThreadTool,
        addReactionTool,
        getChannelHistoryTool,
        getThreadRepliesTool,
        getUsersTool,
        getUserProfileTool,
      ],
    };
  });

  const transport = new StdioServerTransport();
  console.error("서버를 트랜스포트에 연결 중...");
  await server.connect(transport);

  console.error("Slack MCP 서버가 stdio에서 실행 중입니다");
}

main().catch((error) => {
  console.error("main()에서 치명적인 오류 발생:", error);
  process.exit(1);
});