const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../sequelize');

const { STRING, INTEGER, UUIDV4, BOOLEAN } = DataTypes;

class Address extends Model {}

Address.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    name: {
      type: STRING,
      allowNull: true,
      comment: 'Address Label Name',
    },
    number: {
      type: STRING,
      allowNull: true,
      comment: 'number',
    },
    line1: {
      type: STRING,
      allowNull: true,
      comment: 'Address line 1',
    },
    line2: {
      type: STRING,
      allowNull: true,
      comment: 'Address line 2',
    },
    city: {
      type: STRING,
      allowNull: true,
      comment: 'City',
    },
    postcode: {
      type: STRING,
      allowNull: true,
      comment: 'postcode',
    },
    active: {
      type: BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: 'is new address',
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "To store all user's address",
    tableName: 'address',
    modelName: 'address',
  }
);

// userId
module.exports = Address;
