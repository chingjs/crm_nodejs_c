const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { DATE, STRING, BOOLEAN, FLOAT, DATEONLY } = DataTypes;

class Receipt extends Model { }

Receipt.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		receipt_date: {
			type: DATEONLY,
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

		amount: {
			type: FLOAT,
			allowNull: true,
			comment: "receipt amount"
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
		}
	},
	{
		sequelize,
		comment: "To store all receipt details",
		tableName: "receipt",
		modelName: "receipt"
	}
);

module.exports = Receipt;
