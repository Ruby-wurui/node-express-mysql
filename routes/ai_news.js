const express = require('express');
const router = express.Router();

// Get database models
let AINews = null;

// Middleware to ensure database connection
router.use((req, res, next) => {
    if (!AINews && req.app.db && req.app.db.models) {
        AINews = req.app.db.models.AINews;
    }

    if (!AINews) {
        return res.status(500).json({
            success: false,
            error: 'Database not initialized'
        });
    }

    next();
});

// GET /api/ai-news
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, source, tag, sort } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let whereClause = {};

        if (source) {
            whereClause.source = source;
        }

        // Simple tag filtering (JSON array contains)
        // Note: SQLite/MySQL JSON support varies, this is a basic implementation
        if (tag) {
            // For MySQL JSON column
            whereClause.tags = {
                [AINews.sequelize.Sequelize.Op.contains]: [tag] // or JSON_CONTAINS
            };
        }

        let order = [['published_at', 'DESC']];
        if (sort === 'hot') {
            order = [['score', 'DESC'], ['published_at', 'DESC']];
        }

        const { count, rows: news } = await AINews.findAndCountAll({
            where: whereClause,
            order: order, // Use the dynamically determined order
            offset: offset,
            limit: limitNum,
            attributes: ['id', 'title', 'url', 'source', 'summary', 'published_at', 'tags', 'score', 'image_url'] // Explicitly list attributes
        });

        res.json({
            success: true,
            data: {
                news,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('AI News fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch AI news'
        });
    }
});

// POST /api/ai-news/crawl (Protected)
router.post('/crawl', async (req, res) => {
    // TODO: Add admin authentication
    try {
        const crawler = require('../services/ai_crawler')(req.app);

        // Run asynchronously
        crawler.run();

        res.json({
            success: true,
            message: 'Crawler started'
        });
    } catch (error) {
        console.error('Crawler trigger error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start crawler'
        });
    }
});

module.exports = router;
