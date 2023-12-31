const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { STRING, BOOLEAN, FLOAT } = DataTypes;

class Item extends Model {}

Item.init(
	{
		id: {
			type: DataTypes.INTEGER,
		    autoIncrement: true,
		    primaryKey: true,
		    unique: true
		},
		quantity: {
			type: FLOAT,
			allowNull: true,
			comment: "quantity of that item"
		},
		price: {
			type: FLOAT,
			allowNull: true,
			comment: "price of the items in a transaction"
		}
	},
	{
		sequelize,
		comment: "To store all sku details",
		tableName: "item",
		modelName: "item"
	}
);

module.exports = Item;
