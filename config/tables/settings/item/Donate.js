const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../../sequelize");

const { UUID, UUIDV4, STRING, BOOLEAN, FLOAT } = DataTypes;

class Donate extends Model {}

Donate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    itemId: {
      type: STRING,
      allowNull: false,
      comment: "Item ID",
    },
    itemName: {
      type: STRING,
      allowNull: false,
      comment: "Item Name",
    },
    itemImage: {
      type: STRING,
      allowNull: false,
      comment: "image key for AWS S3",
    },
    description: {
      type: STRING(99999),
    },
    bmDescription: {
      type: STRING(99999),
    },
    bmItemName: {
      type: STRING,
      allowNull: true,
      comment: "BM Item Name",
    },
    bmItemImage: {
      type: STRING,
      allowNull: true,
      comment: "BM image key for AWS S3 ",
    },

    points: {
      type: FLOAT,
      allowNull: false,
      comment: "points required to redeem ",
    },
    active: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "available for redemption",
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "Donate Category",
    tableName: "donate",
    modelName: "donate",
  }
);

module.exports = Donate;
