const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../sequelize');

const { STRING, FLOAT } = DataTypes;

class Inventory extends Model {}

Inventory.init(
  {
    type: {
      type: STRING,
      allowNull: false,
      comment: 'sample | pointshop',
    },
    usedCount: {
      type: FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'used counts',
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: 'Inventory counts',
    tableName: 'inventory',
    modelName: 'inventory',
  }
);

module.exports = Inventory;
