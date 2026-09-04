using GameStore.Api.Data;
using GameStore.Api.Endpoints;
using GameStore.Api.Models;
using GameStore.Api.Mcp;

using Microsoft.EntityFrameworkCore;

using Piranha;
using Piranha.AspNetCore.Identity.SQLite;
using Piranha.Data.EF.SQLite;
using Piranha.AttributeBuilder;
using Piranha.Extend.Blocks;
using Piranha.Models;

using ModelContextProtocol.Server;

using Microsoft.Extensions.AI;
using OllamaSharp;
using GameStore.Api.Ai;




var builder = WebApplication.CreateBuilder(args);


// ========================================
// GameStore 原来的配置
// ========================================

builder.Services.AddValidation();

builder.AddGameStoreDb();


// ========================================
// Piranha CMS 配置
// ========================================

builder.AddPiranha(options =>
{
    // 开启 CMS
    options.UseCms();

    // 开启 Manager 后台
    options.UseManager();

    // 本地文件存储
    options.UseFileStorage(
        naming: Piranha.Local.FileStorageNaming.UniqueFolderNames
    );

    // 图片处理
    options.UseImageSharp();

    // 内存缓存
    options.UseMemoryCache();


    // 读取 appsettings.json 里面的 Piranha connection string
    var piranhaConnectionString =
        builder.Configuration.GetConnectionString("Piranha");


    // Piranha 内容数据库
    options.UseEF<SQLiteDb>(db =>
        db.UseSqlite(piranhaConnectionString)
    );


    // Piranha Manager 登录用户数据库
    options.UseIdentityWithSeed<IdentitySQLiteDb>(db =>
        db.UseSqlite(piranhaConnectionString)
    );
});

// ========================================
// MCP Server 配置
// ========================================
builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithTools<PiranhaTools>();

// ========================================
// Ollama AI 配置
// ========================================
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

builder.Services.AddScoped<PiranhaAiAgent>();


// ========================================
// 创建 WebApplication
// ========================================

var app = builder.Build();

app.UseStaticFiles();

// ========================================
// MCP Server endpoints
// ========================================
app.MapMcp("/mcp");


// ========================================
// Development error page
// ========================================

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}


// ========================================
// Piranha
// ========================================

app.UsePiranha(options =>
{
    // 初始化 Piranha
    App.Init(options.Api);

    var managerModule =
    App.Modules.Get<Piranha.Manager.Module>();

    managerModule.Styles.Add(
        "~/ai-manager/ai-chat.css"
    );

    managerModule.Scripts.Add(
        "~/ai-manager/ai-chat.js"
    );


    // 注册 Page Types
    new ContentTypeBuilder(options.Api)
        .AddAssembly(typeof(Program).Assembly)
        .Build();


    // ==============================
    // 注册 Piranha 自带 Blocks
    // ==============================

    App.Blocks.Register<TextBlock>();

    App.Blocks.Register<HtmlBlock>();

    App.Blocks.Register<ImageBlock>();

    App.Blocks.Register<QuoteBlock>();

    App.Blocks.Register<SeparatorBlock>();


    // Manager
    options.UseManager();

    // Login
    options.UseIdentity();
});


// ========================================
// GameStore 原来的 Minimal API endpoints
// ========================================

app.MapGamesEndpoints();

app.MapGenresEndpoints();

// ========================================
// Piranha CMS API
// ========================================

app.MapGet("/cms/pages/{slug}", async (
    string slug,
    IApi api) =>
{
    var page =
        await api.Pages.GetBySlugAsync<SimplePage>(slug);

    if (page is null)
    {
        return Results.NotFound();
    }


    // 把 Piranha Blocks 转成前端容易理解的 JSON
    var blocks = page.Blocks
        .Select((block, index) =>
        {
            object? result = block switch
            {
                TextBlock text => new
                {
                    index,
                    type = "text",
                    content = text.Body?.Value
                },

                QuoteBlock quote => new
                {
                    index,
                    type = "quote",
                    content = quote.Body?.Value
                },

                SeparatorBlock => new
                {
                    index,
                    type = "separator"
                },

                ImageBlock image => new
                {
                    index,
                    type = "image",

                    url = image.Body?
                        .Media?
                        .PublicUrl?
                        .Replace("~/", "/")
                },

                _ => null
            };

            return result;
        })
        .Where(block => block is not null)
        .ToList();


    return Results.Ok(new
    {
        id = page.Id,
        title = page.Title,
        slug = page.Slug,

        banner = new
        {
            title =
                page.Banner?.Title?.Value,

            subtitle =
                page.Banner?.Subtitle?.Value,

            backgroundImage =
                page.Banner?
                    .BackgroundImage?
                    .Media?
                    .PublicUrl?
                    .Replace("~/", "/"),

            buttonText =
                page.Banner?.ButtonText?.Value,

            buttonLink =
                page.Banner?.ButtonLink?.Value
        },

        // 新增
        blocks
    });
});


// ========================================
// Piranha CMS AI endpoints
// ========================================
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

        return Results.Ok(
            new
            {
                reply
            }
        );
    });





// ========================================
// GameStore database migration
// ========================================

app.MigrateDb();


// ========================================
// Start application
// ========================================

app.Run();
