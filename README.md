# GameStore Piranha CMS + MCP + Local AI Integration

This project integrates **Piranha CMS**, an **MCP Server**, and a local **Ollama** model so an AI assistant inside Piranha Manager can modify CMS pages through MCP tools.

## 1. Main Components

| Component | Responsibility |
|---|---|
| `ai-chat.js` | Chat UI inside Piranha Manager; sends user message + current PageId |
| `/ai/chat` | Normal ASP.NET POST endpoint used by the browser |
| `AiRequest` | DTO for `message` and `pageId` |
| `PiranhaAiAgent` | Connects Ollama and MCP together |
| `IChatClient` | Microsoft.Extensions.AI abstraction registered to use Ollama |
| `McpClient` | Connects to the local MCP Server and discovers tools |
| `/mcp` | MCP HTTP endpoint |
| `PiranhaTools` | MCP tool implementations such as AddTextBlock and UpdateBanner |
| `IApi` | Piranha CMS API used by tools/endpoints to load and save content |
| `Piranha.db` | Piranha CMS SQLite database |

## 2. Prerequisites

- .NET 10 SDK
- Node.js / npm
- Ollama installed locally
- Piranha CMS packages configured in the ASP.NET project

Check .NET:

```bash
dotnet --version
```

Check Ollama:

```bash
ollama --version
```

Start Ollama if needed:

```bash
ollama serve
```

Pull the model used by this project:

```bash
ollama pull qwen3:4b
```

Test Ollama:

```bash
curl http://localhost:11434/api/tags
```

## 3. NuGet Packages

Core MCP + AI packages:

```bash
dotnet add package ModelContextProtocol.AspNetCore
dotnet add package Microsoft.Extensions.AI
dotnet add package OllamaSharp
```

Typical Piranha packages used by this project include:

```bash
dotnet add package Piranha
dotnet add package Piranha.AspNetCore
dotnet add package Piranha.Manager
dotnet add package Piranha.Data.EF.SQLite
dotnet add package Piranha.AspNetCore.Identity.SQLite
dotnet add package Piranha.ImageSharp
dotnet add package Piranha.Local.FileStorage
dotnet add package Piranha.AttributeBuilder
```

To see exact installed versions:

```bash
dotnet list package
```

## 4. Important `using` Directives

`Program.cs` commonly needs:

```csharp
using Microsoft.Extensions.AI;
using ModelContextProtocol.Server;
using OllamaSharp;
using Piranha;
using Piranha.Models;

using GameStore.Api.Ai;
using GameStore.Api.Mcp;
```

`PiranhaAiAgent.cs`:

```csharp
using Microsoft.Extensions.AI;
using ModelContextProtocol.Client;
```

`PiranhaTools.cs`:

```csharp
using ModelContextProtocol.Server;
using Piranha;
using Piranha.Extend.Blocks;
using Piranha.Extend.Fields;
```

## 5. Register Ollama

In `Program.cs`, before `builder.Build()`:

```csharp
builder.Services.AddSingleton<IChatClient>(_ =>
{
    IChatClient ollamaClient =
        new OllamaApiClient(
            new Uri("http://localhost:11434"),
            "qwen3:4b"
        );

    return new ChatClientBuilder(ollamaClient)
        .UseFunctionInvocation()
        .Build();
});
```

This registers an `IChatClient` backed by Ollama in ASP.NET Core DI.

`UseFunctionInvocation()` executes tool/function calls produced by the model and returns tool results to the model.

## 6. Register the AI Agent

```csharp
builder.Services.AddScoped<PiranhaAiAgent>();
```

ASP.NET Core DI creates `PiranhaAiAgent` when an endpoint needs it.

Constructor:

```csharp
public PiranhaAiAgent(IChatClient chatClient)
{
    _chatClient = chatClient;
}
```

Because the constructor requires `IChatClient`, DI resolves the Ollama-backed `IChatClient` registered above and injects it.

## 7. Register the MCP Server

Before `builder.Build()`:

```csharp
builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithTools<PiranhaTools>();
```

After `builder.Build()`:

```csharp
app.MapMcp("/mcp");
```

`/mcp` is the MCP protocol endpoint used by MCP clients.

## 8. MCP Tool Class

```csharp
using ModelContextProtocol.Server;
using Piranha;
using Piranha.Extend.Blocks;
using Piranha.Extend.Fields;

namespace GameStore.Api.Mcp;

[McpServerToolType]
public class PiranhaTools
{
    [McpServerTool]
    public static async Task<string> AddTextBlock(
        IApi api,
        string slug,
        string content)
    {
        var page =
            await api.Pages.GetBySlugAsync<SimplePage>(slug);

        if (page is null)
        {
            return "Page not found.";
        }

        var block =
            new TextBlock
            {
                Body =
                    new TextField
                    {
                        Value = content
                    }
            };

        page.Blocks.Add(block);

        await api.Pages.SaveAsync(page);

        return "Text block added successfully.";
    }
}
```

`[McpServerToolType]` and `[McpServerTool]` are C# MCP SDK attributes. They are not part of the MCP wire protocol itself.

## 9. AI Request DTO

`Ai/AiRequest.cs`:

```csharp
namespace GameStore.Api.Ai;

public record AiRequest(
    string Message,
    string? PageId
);
```

Example browser JSON:

```json
{
  "message": "Add a text block saying Hello",
  "pageId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 10. `/ai/chat` Endpoint

```csharp
app.MapPost(
    "/ai/chat",
    async (
        AiRequest request,
        PiranhaAiAgent agent,
        IApi api) =>
    {
        string? slug = null;

        if (Guid.TryParse(request.PageId, out var pageId))
        {
            var page =
                await api.Pages.GetByIdAsync<PageBase>(pageId);

            slug = page?.Slug;
        }

        var reply =
            await agent.ChatAsync(
                request.Message,
                slug
            );

        return Results.Ok(new
        {
            reply
        });
    });
```

Parameter sources:

```text
AiRequest request      <- HTTP request body
PiranhaAiAgent agent   <- dependency injection
IApi api               <- dependency injection
```

## 11. `PiranhaAiAgent`

```csharp
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
        var transport =
            new HttpClientTransport(
                new HttpClientTransportOptions
                {
                    Endpoint =
                        new Uri("http://localhost:5159/mcp")
                });

        await using var mcpClient =
            await McpClient.CreateAsync(transport);

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
```

### Agent flow

```text
Create HTTP MCP transport
        |
        v
Create McpClient
        |
        v
ListToolsAsync()
        |
        v
Receive MCP tool proxy objects
        |
        v
Put them into ChatOptions.Tools
        |
        v
Send messages + tools to Ollama
        |
        v
Model chooses a tool if needed
        |
        v
UseFunctionInvocation executes the McpClientTool
        |
        v
MCP Client sends tools/call to /mcp
```

## 12. Piranha Manager Chatbox

`wwwroot/ai-manager/ai-chat.js` sends:

```javascript
const response =
    await fetch(
        "/ai/chat",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                message: text,
                pageId: pageId
            })
        }
    );
```

The `body` is the outgoing HTTP request data. `const response` is the HTTP response returned by the backend.

## 13. Full Runtime Flow

```text
1. User opens a page in Piranha Manager.
2. ai-chat.js reads PageId from the Manager URL.
3. User submits a natural-language instruction.
4. Browser POSTs message + PageId to /ai/chat.
5. ASP.NET Core binds JSON to AiRequest.
6. DI supplies PiranhaAiAgent and IApi.
7. Endpoint converts PageId -> page -> slug.
8. Endpoint calls agent.ChatAsync(message, slug).
9. Agent creates MCP Client connected to /mcp.
10. MCP Client calls ListToolsAsync().
11. MCP Server returns Piranha MCP tools.
12. Agent puts tools in ChatOptions.
13. Agent sends prompt + message + tools to Ollama.
14. Ollama chooses a tool if needed.
15. UseFunctionInvocation executes the selected McpClientTool.
16. McpClientTool sends tools/call to /mcp.
17. MCP Server dispatches to PiranhaTools.
18. Tool uses IApi to read/modify/save the page.
19. Tool result returns to the MCP Client.
20. Tool result goes back to Ollama.
21. Ollama generates a final response.
22. /ai/chat returns `{ reply: ... }`.
23. ai-chat.js displays the reply.
24. Reload Manager if needed to show saved changes immediately.
```

## 14. MCP Inspector Testing

Run:

```bash
npx @modelcontextprotocol/inspector
```

Connect it to:

```text
http://localhost:5159/mcp
```

Inspector flow:

```text
Inspector -> /mcp -> MCP Server -> PiranhaTools -> IApi
```

Ollama and `PiranhaAiAgent` are not involved in this test.

## 15. Suggested Project Structure

```text
GameStore.Api/
|
|-- Ai/
|   |-- AiRequest.cs
|   `-- PiranhaAiAgent.cs
|
|-- Mcp/
|   `-- PiranhaTools.cs
|
|-- Models/
|   `-- SimplePage.cs
|
|-- wwwroot/
|   `-- ai-manager/
|       |-- ai-chat.js
|       `-- ai-chat.css
|
|-- Program.cs
|-- Piranha.db
`-- GameStore.db
```

## 16. Troubleshooting

### Ollama connection fails

```bash
curl http://localhost:11434/api/tags
```

If needed:

```bash
ollama serve
```

### MCP tools do not appear

Confirm:

```csharp
builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithTools<PiranhaTools>();

app.MapMcp("/mcp");
```

And:

```csharp
[McpServerToolType]
public class PiranhaTools
{
    [McpServerTool]
    ...
}
```

### Piranha save fails after adding blocks

Construct fields explicitly:

```csharp
new TextBlock
{
    Body = new TextField
    {
        Value = content
    }
};
```

Quote:

```csharp
new QuoteBlock
{
    Body = new TextField
    {
        Value = quote
    },

    Author = new StringField
    {
        Value = author
    }
};
```

Image:

```csharp
new ImageBlock
{
    Body = new ImageField
    {
        Id = mediaId
    }
};
```

`mediaId` must be the Piranha Media GUID, not an `/uploads` URL.

## 17. Development Start Order

```bash
# Terminal 1
ollama serve

# Terminal 2
dotnet run

# Terminal 3 - if React runs separately
npm run dev
```

## 18. Key Concept Summary

```text
MCP Protocol
= communication rules

MCP C# SDK
= C# library implementing those rules

MCP Server
= exposes tools

MCP Client
= discovers and calls tools

PiranhaTools
= actual business operations

Piranha IApi
= CMS service API

Ollama
= local LLM

IChatClient
= common AI interface

PiranhaAiAgent
= bridge between Ollama and MCP

/ai/chat
= browser-facing endpoint

/mcp
= MCP-client-facing endpoint
```


