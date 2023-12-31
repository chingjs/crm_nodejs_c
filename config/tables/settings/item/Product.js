const { Model, DataTypes, BOOLEAN } = require("sequelize");
const sequelize = require("../../../sequelize");

const { UUID, UUIDV4, STRING, FLOAT } = DataTypes;

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    productId: {
      type: STRING,
      allowNull: false,
      comment: "Product Id",
    },
    itemName: {
      type: STRING,
      allowNull: false,
      comment: "Item Name",
    },
    uom: {
      type: STRING,
      allowNull: false,
      comment: "Unit of Measuring",
    },
    points: {
      type: FLOAT,
      allowNull: false,
      comment: "points required to redeem ",
    },
    totalBalance: {
      type: FLOAT,
      allowNull: false,
      comment: "total balance",
    },
    description: {
      type: STRING(99999),
      allowNull: false,
      comment: "item description",
    },
    itemImage: {
      type: STRING,
      allowNull: false,
      comment: "image key for AWS S3",
    },
    active: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "available for redemption",
    },

    bmName: {
      type: STRING,
      allowNull: false,
      comment: "Item Name",
    },
    bmDescription: {
      type: STRING(99999),
      allowNull: false,
      comment: "item description",
    },
    bmItemImage: {
      type: STRING,
      allowNull: false,
      comment: "image key for AWS S3",
    },
    chName: {
      type: STRING,
      allowNull: false,
      comment: "Item Name",
    },
    chDescription: {
      type: STRING(99999),
      allowNull: false,
      comment: "item description",
    },
    chItemImage: {
      type: STRING,
      allowNull: false,
      comment: "image key for AWS S3",
    },
    pickup_optional: {
      type: STRING,
      allowNull: true,
      comment: "choose if item is optional for pick up aside from delivery",
    },
    filter_by: {
      type: STRING,
      allowNull: true,
      comment: "choose if item is recommended for user",
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "Point shop Product",
    tableName: "product",
    modelName: "product",
  }
);

module.exports = Product;
