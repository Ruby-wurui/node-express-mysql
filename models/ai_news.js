/**
 * AI News MySQL Model
 */
module.exports = (sequelize, DataTypes) => {
    const AINews = sequelize.define('AINews', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        url: {
            type: DataTypes.STRING(512),
            allowNull: false,
            unique: true
        },
        source: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        image_url: {
            type: DataTypes.STRING(512),
            allowNull: true
        },
        summary: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        published_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        score: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'ai_news_items',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['url']
            },
            {
                fields: ['published_at']
            },
            {
                fields: ['source']
            }
        ]
    });

    return AINews;
};
