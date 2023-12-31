const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { STRING, DATE } = DataTypes;

class TierHistory extends Model {}

TierHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    tierChangeDate: {
      type: DATE,
      allowNull: false,
      comment: "when tier change",
    },
    action: {
      type: STRING,
      allowNull: false,
    },
    oldtier: {
      type: STRING,
      allowNull: false,
      comment: "Member, Bronze, Silver and Gold",
    },
    newtier: {
      type: STRING,
      allowNull: false,
      comment: "Member, Bronze, Silver and Gold",
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "tierHistory",
    tableName: "tierHistory",
    modelName: "tierHistory",
  }
);

module.exports = TierHistory;
