export interface CmsBanner {
    title: string | null;
    subtitle: string | null;
    backgroundImage: string | null;
    buttonText: string | null;
    buttonLink: string | null;
}


export interface CmsTextBlock {
    index: number;
    type: 'text';
    content: string | null;
}


export interface CmsQuoteBlock {
    index: number;
    type: 'quote';
    content: string | null;
}


export interface CmsSeparatorBlock {
    index: number;
    type: 'separator';
}


export interface CmsImageBlock {
    index: number;
    type: 'image';
    url: string | null;
}


export type CmsBlock =
    | CmsTextBlock
    | CmsQuoteBlock
    | CmsSeparatorBlock
    | CmsImageBlock;


export interface CmsPage {
    id: string;
    title: string;
    slug: string;
    banner: CmsBanner;

    blocks: CmsBlock[];
}