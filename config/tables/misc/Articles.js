const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { UUID, UUIDV4, STRING, BOOLEAN } = DataTypes;

class Articles extends Model {}

Articles.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    authorName: {
      type: STRING,
      allowNull: true,
      comment: "author name eng",
    },
    authorNameCH: {
      type: STRING,
      allowNull: true,
      comment: "author name ch",
    },
    title: {
      type: STRING(99999),
      allowNull: false,
      comment: "article title",
    },
    titleBM: {
      type: STRING(99999),
      allowNull: false,
      comment: "article title bm",
    },
    titleCH: {
      type: STRING(99999),
      allowNull: false,
      comment: "article title ch",
    },
    description: {
      type: STRING(99999),
      allowNull: false,
      comment: "article description",
    },
    descriptionBM: {
      type: STRING(99999),
      allowNull: false,
      comment: "article description bm",
    },
    descriptionCH: {
      type: STRING(99999),
      allowNull: false,
      comment: "article description ch",
    },
    imageKey: {
      type: STRING,
      allowNull: false,
      comment: "image key for this news",
    },
    bmImageKey: {
      type: STRING,
      allowNull: false,
      comment: "image key for this news in bm",
    },
    chImageKey: {
      type: STRING,
      allowNull: false,
      comment: "image key for this news in ch",
    },
    active: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "hide or show",
    },
    articleCategory: {
      type: STRING,
      allowNull: false,
      comment: "display the category for the article",
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "Articles",
    tableName: "articles",
    modelName: "articles",
  }
);

module.exports = Articles;
