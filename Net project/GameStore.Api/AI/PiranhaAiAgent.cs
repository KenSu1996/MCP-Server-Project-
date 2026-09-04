using Microsoft.Extensions.AI;
using ModelContextProtocol.Client;

namespace GameStore.Api.Ai;

public class PiranhaAiAgent
{
    private readonly IChatClient _chatClient;

    public PiranhaAiAgent(IChatClient chatClient)
    {
        _chatClient = chatClient;
    }

    public async Task<string> ChatAsync(
        string userMessage,
        string? currentPageSlug)
    {
        // 连接你自己的 MCP Server
        var transport =
            new HttpClientTransport(
                new HttpClientTransportOptions
                {
                    Endpoint =
                        new Uri(
                            "http://localhost:5159/mcp"
                        )
                });

        await using var mcpClient =
            await McpClient.CreateAsync(transport);


        // 从 MCP Server 获取所有 tools
        var tools =
            await mcpClient.ListToolsAsync();


        var messages =
            new List<ChatMessage>
            {
                new(
                    ChatRole.System,
                    $"""
                    You are an AI assistant inside Piranha CMS.

                    Current page slug:
                    {currentPageSlug ?? "none"}

                    You can modify Piranha CMS only through
                    the MCP tools provided to you.

                    If the user asks to modify the current page,
                    use the appropriate MCP tools.

                    Do not claim a change succeeded unless
                    the tool succeeded.
                    """
                ),

                new(
                    ChatRole.User,
                    userMessage
                )
            };


        var options =
            new ChatOptions
            {
                Tools = [.. tools]
            };


        var response =
            await _chatClient.GetResponseAsync(
                messages,
                options
            );


        return response.Text;
    }
}