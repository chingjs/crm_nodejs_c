const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { INTEGER, UUIDV4, FLOAT, STRING } = DataTypes;

class OrderItems extends Model {}

OrderItems.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    quantity: {
      type: FLOAT,
      allowNull: false,
      comment: "Purchased Quantities",
    },
    oid: {
      type: STRING,
      allowNull: true,
      comment: "oid",
    },
    name: {
      type: STRING,
      allowNull: true,
      comment: "item name",
    },
    point: {
      type: STRING,
      allowNull: true,
      comment: "old point",
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "User Transaction Items",
    tableName: "orderItems",
    modelName: "orderItems",
  }
);

// please follow this format
// Order.items = [
//     {
//         itemId,
//         itemName,
//         quantity,
//         uom
//     }
// ]

// userId
// orderId
// itemId

module.exports = OrderItems;
