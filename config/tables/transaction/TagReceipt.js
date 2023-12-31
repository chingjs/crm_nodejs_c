const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { STRING, BOOLEAN, FLOAT, DATE } = DataTypes;

class TagReceipt extends Model { }

TagReceipt.init(
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
    transaction_date: {
      type: DATE,
      allowNull: true,
      comment: "incentive to the store",
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
    receipt_date: {
			type: DATE,
			allowNull: true,
			comment: "Receipt Date"
		},
		expired: {
			type: DATE,
			allowNull: true,
			comment: "Receipt Image expired"
		},
		url: {
			type: STRING,
			allowNull: true,
			comment: "Image Url"
		},
		image_key: {
			type: STRING,
			allowNull: false,
			comment: "Image Key for the Receipt"
		},
		invoice_No: {
			type: STRING,
			allowNull: true,
			comment: "Invoice_No of the Receipt"
		},
  },
  {
    sequelize,
    timestamps: true,
    createdat: true,
    updatedat: true,
    comment: "To store all transaction details",
    tableName: "tagReceipt",
    modelName: "tagReceipt",
  }
);

module.exports = TagReceipt;