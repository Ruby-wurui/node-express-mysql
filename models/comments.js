module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define('Comment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        post_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'comments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Comment.associate = (models) => {
        Comment.belongsTo(models.Users, { foreignKey: 'user_id', as: 'user' });
        Comment.belongsTo(models.BlogPost, { foreignKey: 'post_id', as: 'post' });
    };

    return Comment;
};
