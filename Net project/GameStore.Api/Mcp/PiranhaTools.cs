using System.ComponentModel;
using System.Text.Json;

using ModelContextProtocol.Server;

using Piranha;
using Piranha.Extend.Blocks;
using Piranha.Extend.Fields;

using GameStore.Api.Models;


namespace GameStore.Api.Mcp;


[McpServerToolType]
public class PiranhaTools
{
    // =========================================================
    // GET PAGE
    // =========================================================

    [McpServerTool(
        Name = "get_page",
        ReadOnly = true,
        Destructive = false
    )]
    [Description(
        "Gets a Piranha SimplePage by slug."
    )]
    public static async Task<string> GetPage(
        [Description("Page slug, for example hello.")]
        string slug,

        IApi api)
    {
        var page =
            await api.Pages.GetBySlugAsync<SimplePage>(slug);

        if (page is null)
        {
            return JsonSerializer.Serialize(
                new
                {
                    success = false,
                    message = $"Page '{slug}' was not found."
                }
            );
        }


        var blocks =
            page.Blocks.Select(
                (block, index) =>
                {
                    object result =
                        block switch
                        {
                            TextBlock textBlock =>
                                new
                                {
                                    index,
                                    type = "text",
                                    content =
                                        textBlock.Body?.Value
                                },

                            QuoteBlock quoteBlock =>
                                new
                                {
                                    index,
                                    type = "quote",
                                    content =
                                        quoteBlock.Body?.Value,

                                    author =
                                        quoteBlock.Author?.Value
                                },

                            ImageBlock imageBlock =>
                                new
                                {
                                    index,
                                    type = "image",

                                    url =
                                        imageBlock.Body?
                                            .Media?
                                            .PublicUrl?
                                            .Replace("~/", "/"),

                                    mediaId =
                                        imageBlock.Body?.Id
                                },

                            SeparatorBlock =>
                                new
                                {
                                    index,
                                    type = "separator"
                                },

                            _ =>
                                new
                                {
                                    index,
                                    type =
                                        block.GetType().Name
                                }
                        };

                    return result;
                }
            )
            .ToList();


        return JsonSerializer.Serialize(
            new
            {
                success = true,

                page = new
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

                    blocks
                }
            }
        );
    }


    // =========================================================
    // UPDATE BANNER
    // =========================================================

    [McpServerTool(
        Name = "update_banner",
        ReadOnly = false,
        Destructive = false
    )]
    [Description(
        "Updates the banner of an existing Piranha SimplePage."
    )]
    public static async Task<string> UpdateBanner(
        [Description("Page slug.")]
        string slug,

        [Description("New banner title.")]
        string title,

        [Description("New banner subtitle.")]
        string subtitle,

        [Description("New button text.")]
        string buttonText,

        [Description("New button link.")]
        string buttonLink,

        IApi api)
    {
        var page =
            await api.Pages.GetBySlugAsync<SimplePage>(slug);

        if (page is null)
        {
            return $"Page '{slug}' was not found.";
        }


        // Make sure Banner exists
        page.Banner ??=
            new SimplePage.BannerRegion();


        // Make sure every field has the correct Piranha type
        page.Banner.Title ??=
            new StringField();

        page.Banner.Subtitle ??=
            new TextField();

        page.Banner.ButtonText ??=
            new StringField();

        page.Banner.ButtonLink ??=
            new StringField();

        page.Banner.BackgroundImage ??=
            new ImageField();


        // Update values
        page.Banner.Title.Value =
            title;

        page.Banner.Subtitle.Value =
            subtitle;

        page.Banner.ButtonText.Value =
            buttonText;

        page.Banner.ButtonLink.Value =
            buttonLink;


        await api.Pages.SaveAsync(page);


        return
            $"Banner for page '{slug}' was updated successfully.";
    }


    // =========================================================
    // ADD TEXT BLOCK
    // =========================================================

    [McpServerTool(
        Name = "add_text_block",
        ReadOnly = false,
        Destructive = false
    )]
    [Description(
        "Adds a text block to an existing Piranha page."
    )]
    public static async Task<string> AddTextBlock(
        [Description("Page slug.")]
        string slug,

        [Description("Text content.")]
        string content,

        IApi api)
    {
        var page =
            await api.Pages.GetBySlugAsync<SimplePage>(slug);

        if (page is null)
        {
            return $"Page '{slug}' was not found.";
        }


        // IMPORTANT:
        // TextBlock.Body must be TextField
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


        return
            $"Text block added to page '{slug}'.";
    }


    // =========================================================
    // ADD QUOTE BLOCK
    // =========================================================

    [McpServerTool(
        Name = "add_quote_block",
        ReadOnly = false,
        Destructive = false
    )]
    [Description(
        "Adds a quote block to an existing Piranha page."
    )]
    public static async Task<string> AddQuoteBlock(
        [Description("Page slug.")]
        string slug,

        [Description("Quote text.")]
        string quote,

        [Description("Quote author.")]
        string author,

        IApi api)
    {
        var page =
            await api.Pages.GetBySlugAsync<SimplePage>(slug);

        if (page is null)
        {
            return $"Page '{slug}' was not found.";
        }


        // IMPORTANT:
        //
        // QuoteBlock.Body   = TextField
        // QuoteBlock.Author = StringField

        var block =
            new QuoteBlock
            {
                Body =
                    new TextField
                    {
                        Value = quote
                    },

                Author =
                    new StringField
                    {
                        Value = author
                    }
            };


        page.Blocks.Add(block);


        await api.Pages.SaveAsync(page);


        return
            $"Quote block added to page '{slug}'.";
    }


    // =========================================================
    // ADD SEPARATOR BLOCK
    // =========================================================

    [McpServerTool(
        Name = "add_separator",
        ReadOnly = false,
        Destructive = false
    )]
    [Description(
        "Adds a separator block to an existing Piranha page."
    )]
    public static async Task<string> AddSeparator(
        [Description("Page slug.")]
        string slug,

        IApi api)
    {
        var page =
            await api.Pages.GetBySlugAsync<SimplePage>(slug);

        if (page is null)
        {
            return $"Page '{slug}' was not found.";
        }


        // SeparatorBlock has no Body
        var block =
            new SeparatorBlock();


        page.Blocks.Add(block);


        await api.Pages.SaveAsync(page);


        return
            $"Separator added to page '{slug}'.";
    }


    // =========================================================
    // ADD IMAGE BLOCK
    // =========================================================

    [McpServerTool(
        Name = "add_image_block",
        ReadOnly = false,
        Destructive = false
    )]
    [Description(
        "Adds an existing Piranha media image to a page."
    )]
    public static async Task<string> AddImageBlock(
        [Description("Page slug.")]
        string slug,

        [Description(
            "The Piranha Media ID of the image."
        )]
        Guid mediaId,

        IApi api)
    {
        var page =
            await api.Pages.GetBySlugAsync<SimplePage>(slug);

        if (page is null)
        {
            return $"Page '{slug}' was not found.";
        }


        // IMPORTANT:
        // ImageBlock.Body must be ImageField.
        //
        // It stores a Piranha Media ID,
        // NOT a normal image URL.

        var block =
            new ImageBlock
            {
                Body =
                    new ImageField
                    {
                        Id = mediaId
                    }
            };


        page.Blocks.Add(block);


        await api.Pages.SaveAsync(page);


        return
            $"Image block added to page '{slug}'.";
    }
}