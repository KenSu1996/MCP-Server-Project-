using Piranha.AttributeBuilder;
using Piranha.Models;
using Piranha.Extend.Fields;
using Piranha.Extend;

namespace GameStore.Api.Models;

[PageType(Title = "Simple Page")]
public class SimplePage : Page<SimplePage>
{
    [Region(Title = "Banner", SortOrder = 1)]
    public BannerRegion Banner { get; set; } = new();

    public class BannerRegion
    {
        [Field(Title = "Banner Title")]
        public StringField Title { get; set; } = new();

        [Field(Title = "Banner Subtitle")]
        public TextField Subtitle { get; set; } = new();

        [Field(Title = "Background Image")]
        public ImageField BackgroundImage { get; set; } = new();

        [Field(Title = "Button Text")]
        public StringField ButtonText { get; set; } = new();

        [Field(Title = "Button Link")]
        public StringField ButtonLink { get; set; } = new();
    }
}