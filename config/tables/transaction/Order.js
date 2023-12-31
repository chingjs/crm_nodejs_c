const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { INTEGER, UUIDV4, STRING, BOOLEAN } = DataTypes;

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    trackingId: {
      type: STRING,
      allowNull: true,
      comment: "Tracking ID to be sent to Vinda",
    },
    type: {
      type: STRING,
      allowNull: false,
      comment: "order type",
    },
    status: {
      type: STRING,
      allowNull: true,
      defaultValue: "PREPARING",
      comment: "received sample",
    },
    deliveryOption: {
      type: STRING,
      allowNull: true,
      comment: "Delivery by self collect or delivery",
    },
    remark: {
      type: STRING,
      allowNull: true,
      comment: "Remark by self collect or delivery",
    },
    name: {
      type: STRING,
      allowNull: true,
      comment: "Address Label Name",
    },
    number: {
      type: STRING,
      allowNull: true,
      comment: "number",
    },
    line1: {
      type: STRING,
      allowNull: true,
      comment: "Address line 1",
    },
    line2: {
      type: STRING,
      allowNull: true,
      comment: "Address line 2",
    },
    city: {
      type: STRING,
      allowNull: true,
      comment: "City",
    },
    postcode: {
      type: STRING,
      allowNull: true,
      comment: "postcode",
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "To track all user's transactions",
    tableName: "order",
    modelName: "order",
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
// addressId

module.exports = Order;
