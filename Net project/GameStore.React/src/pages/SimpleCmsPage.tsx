import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import CmsClient from '../clients/CmsClient';
import { CmsPage } from '../models/CmsPage';


const SimpleCmsPage: React.FC = () => {

    const { slug } = useParams();

    const [page, setPage] =
        useState<CmsPage | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);


    useEffect(() => {

        if (!slug) {
            return;
        }

        const client = new CmsClient();

        const loadPage = async () => {

            try {

                setLoading(true);

                const cmsPage =
                    await client.getPageAsync(slug);

                setPage(cmsPage);

            }
            catch (err) {

                if (err instanceof Error) {
                    setError(err.message);
                }
                else {
                    setError('Unable to load page');
                }

            }
            finally {
                setLoading(false);
            }
        };

        loadPage();

    }, [slug]);


    if (loading) {
        return (
            <div className="state-panel">
                Loading page...
            </div>
        );
    }


    if (error || !page) {
        return (
            <div className="state-panel">
                <h2>Page not found</h2>
                <p>{error}</p>
            </div>
        );
    }


    return (
    <div>

        {/* ===================== */}
        {/* Banner */}
        {/* ===================== */}

        <section
            className="hero-panel"
            style={
                page.banner.backgroundImage
                    ? {
                        backgroundImage:
                            `linear-gradient(
                                rgba(8, 10, 25, 0.65),
                                rgba(8, 10, 25, 0.85)
                            ),
                            url(${page.banner.backgroundImage})`,

                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }
                    : undefined
            }
        >

            <div
                className="position-relative"
                style={{ zIndex: 1 }}
            >

                <span className="eyebrow">
                    <i className="bi bi-stars"></i>
                    {' '}Welcome
                </span>


                <h1 className="hero-title">
                    {page.banner.title || page.title}
                </h1>


                {page.banner.subtitle && (
                    <p className="hero-copy">
                        {page.banner.subtitle}
                    </p>
                )}


                {page.banner.buttonText &&
                 page.banner.buttonLink && (

                    <div className="mt-4">

                        <Link
                            className="primary-action"
                            to={page.banner.buttonLink}
                        >
                            {page.banner.buttonText}
                        </Link>

                    </div>
                )}

            </div>

        </section>


        {/* ===================== */}
        {/* CMS BLOCKS */}
        {/* ===================== */}

        <section className="cms-content">

    {page.blocks.map((block) => {

        switch (block.type) {

            case 'text':

                return (
                    <div
                        key={block.index}
                        className="cms-block"
                    >
                        <div className="cms-block-label">
                            TEXT
                        </div>

                        <div className="cms-text-block">
                            {block.content}
                        </div>
                    </div>
                );


            case 'quote':

                return (
                    <div
                        key={block.index}
                        className="cms-block"
                    >
                        <div className="cms-block-label">
                            QUOTE
                        </div>

                        <blockquote className="cms-quote-block">
                            {block.content}
                        </blockquote>
                    </div>
                );


            case 'separator':

                return (
                    <div
                        key={block.index}
                        className="cms-block"
                    >
                        <div className="cms-block-label">
                            SEPARATOR
                        </div>

                        <hr className="cms-separator" />
                    </div>
                );


            case 'image':

                if (!block.url) {
                    return null;
                }

                return (
                    <div
                        key={block.index}
                        className="cms-block"
                    >
                        <div className="cms-block-label">
                            IMAGE
                        </div>

                        <img
                            className="cms-image-block"
                            src={block.url}
                            alt=""
                        />
                    </div>
                );


            default:
                return null;
        }

    })}

</section>

    </div>
    );
};


export default SimpleCmsPage;