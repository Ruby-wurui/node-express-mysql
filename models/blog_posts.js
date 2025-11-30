/**
 * Blog Posts MySQL Model
 * Created for interactive blog timeline feature
 */
module.exports = (sequelize, DataTypes) => {
  const BlogPost = sequelize.define('BlogPost', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isLowercase: true
      }
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    code_examples: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    challenge: {
      type: DataTypes.JSON,
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
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    interaction_stats: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        code_executions: 0,
        challenge_attempts: 0,
        challenge_successes: 0
      }
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    }
  }, {
    tableName: 'blog_posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['slug']
      },
      {
        fields: ['published_at']
      },
      {
        fields: ['status']
      },
      {
        fields: ['featured']
      }
    ]
  });

  // Instance methods
  BlogPost.prototype.incrementViewCount = function () {
    return this.increment('view_count');
  };

  BlogPost.prototype.incrementCodeExecutions = function () {
    const stats = this.interaction_stats || { code_executions: 0, challenge_attempts: 0, challenge_successes: 0 };
    stats.code_executions = (stats.code_executions || 0) + 1;
    return this.update({ interaction_stats: stats });
  };

  BlogPost.prototype.incrementChallengeAttempts = function () {
    const stats = this.interaction_stats || { code_executions: 0, challenge_attempts: 0, challenge_successes: 0 };
    stats.challenge_attempts = (stats.challenge_attempts || 0) + 1;
    return this.update({ interaction_stats: stats });
  };

  BlogPost.prototype.incrementChallengeSuccesses = function () {
    const stats = this.interaction_stats || { code_executions: 0, challenge_attempts: 0, challenge_successes: 0 };
    stats.challenge_successes = (stats.challenge_successes || 0) + 1;
    return this.update({ interaction_stats: stats });
  };

  // Class methods
  BlogPost.findPublished = function (options = {}) {
    return this.findAll({
      where: {
        status: 'published',
        published_at: {
          [sequelize.Sequelize.Op.lte]: new Date()
        },
        ...options.where
      },
      order: [['published_at', 'DESC']],
      ...options
    });
  };

  BlogPost.findBySlug = function (slug) {
    return this.findOne({
      where: {
        slug,
        status: 'published'
      }
    });
  };

  BlogPost.findByTag = function (tag, options = {}) {
    return this.findAll({
      where: {
        status: 'published',
        tags: {
          [sequelize.Sequelize.Op.contains]: [tag]
        },
        ...options.where
      },
      order: [['published_at', 'DESC']],
      ...options
    });
  };

  BlogPost.associate = (models) => {
    if (models.Comment) {
      BlogPost.hasMany(models.Comment, { foreignKey: 'post_id', as: 'comments' });
    }
  };

  return BlogPost;
};