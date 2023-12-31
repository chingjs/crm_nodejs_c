const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { UUID, UUIDV4, STRING, BOOLEAN, FLOAT, DATE } = DataTypes;

class Claim extends Model {}

Claim.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    statementID: {
      type: STRING,
      allowNull: true,
      comment: "statement id",
    },
    paymentType: {
      type: STRING,
      allowNull: false,
      comment: "retailer's payment method via Bank Transfer or TnG",
    },
    name: {
      type: STRING,
      allowNull: false,
      comment: "retailer's name",
    },
    number: {
      type: STRING,
      allowNull: true,
      comment: "retailer's phone number",
    },
    bank_name: {
      type: STRING,
      allowNull: true,
      comment: "retailer's bank name",
    },
    bank_account: {
      type: STRING,
      allowNull: true,
      comment: "retailer's bank account detail",
    },
    redeem_amount: {
      type: STRING,
      allowNull: false,
      comment: "Retailer's total amount can be redeemed",
    },
    status: {
			type: STRING,
			allowNull: false,
			comment: "status validate"
		},
    // last_activity_date: {
    //   type: DATE,
    //   allowNull: true,
    //   comment: "last activity Date of the retailer",
    // },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "Retailer's received amount for every quarterly entitlement",
    tableName: "claim",
    modelName: "claim",
  }
);

module.exports = Claim;
