import { CmsPage } from '../models/CmsPage';

class CmsClient {

    private baseUrl = '/api/cms/pages';

    async getPageAsync(slug: string): Promise<CmsPage> {

        const response = await fetch(
            `${this.baseUrl}/${encodeURIComponent(slug)}`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load CMS page: ${response.status}`
            );
        }

        return await response.json();
    }
}

export default CmsClient;