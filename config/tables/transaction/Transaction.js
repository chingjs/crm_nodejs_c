const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { STRING, BOOLEAN, FLOAT, DATE } = DataTypes;

class Transaction extends Model { }

Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    status: {
      type: STRING,
      allowNull: false,
      comment: "status of transaction",
    },
    reason: {
      type: STRING,
      allowNull: true,
      comment: "reason of validate",
    },
    language: {
      type: STRING,
      allowNull: true,
      comment: "language",
    },
    sales: {
      type: FLOAT,
      allowNull: false,
      comment: "sales of this transaction",
    },
    transaction_date: {
      type: DATE,
      allowNull: true,
      comment: "incentive to the store",
    },
    promo: {
      type: BOOLEAN,
      allowNull: true,
      comment: "promo status of transaction",
    },
    state: {
      type: STRING,
      allowNull: true,
      comment: "State of this transaction",
    },
    validator_name: {
      type: STRING,
      allowNull: true,
      comment: "validator name",
    },
    validator_id: {
      type: STRING,
      allowNull: true,
      comment: "validator Id date",
    },
    validated_date: {
      type: DATE,
      allowNull: true,
      comment: "validation date",
    },
    rewardType: {
      type: STRING,
      allowNull: true,
      comment: "reward type",
    },
    active: {
      type: BOOLEAN,
      defaultValue:true,

    }
  },
  {
    sequelize,
    timestamps: true,
    createdat: true,
    updatedat: true,
    comment: "To store all transaction details",
    tableName: "transaction",
    modelName: "transaction",
  }
);

module.exports = Transaction;
