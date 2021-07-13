const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_HOST)

const AnimeLink = sequelize.define('AnimeLink', {
    UserID:{
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    AnimeID:{
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    link: {
        type: DataTypes.STRING,
        defaultValue: "#"
    }
});

module.exports=AnimeLink;
