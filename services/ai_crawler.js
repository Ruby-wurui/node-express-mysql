const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

module.exports = (app) => {
    const AINews = app.db.models.AINews;

    const getMetadata = async (url) => {
        try {
            const { data } = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
                }
            });
            const $ = cheerio.load(data);
            const image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
            const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
            return { image, description };
        } catch (error) {
            return { image: null, description: null };
        }
    };

    const crawlHackerNews = async () => {
        try {
            console.log('Crawling Hacker News for AI...');
            const response = await axios.get('https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&hitsPerPage=20');
            const hits = response.data.hits;

            for (const hit of hits) {
                if (!hit.url) continue;

                try {
                    let newsItem = await AINews.findOne({ where: { url: hit.url } });

                    // If item exists and has image, skip
                    if (newsItem && newsItem.image_url) continue;

                    const { image, description } = await getMetadata(hit.url);

                    if (newsItem) {
                        // Update existing item if it has no image
                        if (image || description) {
                            await newsItem.update({
                                image_url: image || newsItem.image_url,
                                summary: description || newsItem.summary
                            });
                            console.log(`Updated metadata for: ${hit.title}`);
                        }
                    } else {
                        // Create new item
                        await AINews.create({
                            title: hit.title,
                            url: hit.url,
                            source: 'Hacker News',
                            published_at: new Date(hit.created_at),
                            score: hit.points || 0,
                            tags: hit._tags,
                            image_url: image,
                            summary: description
                        });
                    }
                } catch (err) {
                    // Ignore duplicates or errors for individual items
                }
            }
            console.log('Hacker News crawl completed.');
        } catch (error) {
            console.error('Hacker News crawl error:', error.message);
        }
    };

    const crawlReddit = async (subreddit) => {
        try {
            console.log(`Crawling Reddit r/${subreddit}...`);
            const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=20`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });

            const posts = response.data.data.children;

            for (const post of posts) {
                const data = post.data;
                if (data.stickied || data.is_self) continue;

                try {
                    let newsItem = await AINews.findOne({ where: { url: data.url } });

                    // If item exists and has image, skip
                    if (newsItem && newsItem.image_url) continue;

                    // Reddit often provides a preview image in the JSON
                    let image = data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');
                    let description = data.selftext;

                    if (!image) {
                        // Try to get thumbnail if preview is missing
                        if (data.thumbnail && data.thumbnail.startsWith('http')) {
                            image = data.thumbnail;
                        }
                    }

                    if (!image && !description) {
                        const metadata = await getMetadata(data.url);
                        image = metadata.image;
                        description = metadata.description;
                    }

                    if (newsItem) {
                        if (image || description) {
                            await newsItem.update({
                                image_url: image || newsItem.image_url,
                                summary: description || newsItem.summary
                            });
                            console.log(`Updated metadata for: ${data.title}`);
                        }
                    } else {
                        await AINews.create({
                            title: data.title,
                            url: data.url,
                            source: `Reddit r/${subreddit}`,
                            published_at: new Date(data.created_utc * 1000),
                            score: data.score,
                            tags: [subreddit, data.link_flair_text].filter(Boolean),
                            image_url: image,
                            summary: description
                        });
                    }
                } catch (err) {
                    // Ignore duplicates
                }
            }
            console.log(`Reddit r/${subreddit} crawl completed.`);
        } catch (error) {
            console.error(`Reddit r/${subreddit} crawl error:`, error.message);
        }
    };

    const runCrawler = async () => {
        console.log('Starting AI News Crawler...');
        await crawlHackerNews();
        await crawlReddit('LocalLLaMA');
        await crawlReddit('ArtificialInteligence');
        await crawlReddit('openai');
        console.log('AI News Crawler finished.');
    };

    // Schedule crawler to run every 12 hours
    cron.schedule('0 */12 * * *', () => {
        runCrawler();
    });

    // Expose crawler for manual triggering
    return {
        run: runCrawler
    };
};
