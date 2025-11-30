/**
 * Created by yubh on 2018/2/7.
 */
//import bcrypt from "bcrypt"
const bcrypt = require('bcrypt');
module.exports = (sequelize, DataType) => {
    'use strick'
    const Users = sequelize.define('Users', {
        id: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataType.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        password: {
            type: DataType.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        email: {
            type: DataType.STRING,
            unique: true,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        role: {
            type: DataType.ENUM('admin', 'user'),
            allowNull: false,
            defaultValue: 'user'
        }

    }, {
        hooks: {
            beforeCreate: user => {
                const salt = bcrypt.genSaltSync();
                user.password = bcrypt.hashSync(user.password, salt);
            }
        }
    });

    Users.associate = (models) => {
        Users.hasMany(models.Tasks);
        if (models.Comment) {
            Users.hasMany(models.Comment, { foreignKey: 'user_id', as: 'comments' });
        }
    };
    Users.isPassword = (encodedPassword, password) => {
        //比较原密码与库里存的hash密码是否相等
        return bcrypt.compareSync(password, encodedPassword);
    };

    return Users

};

