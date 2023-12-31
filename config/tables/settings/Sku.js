const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { STRING, BOOLEAN, FLOAT } = DataTypes;

class Sku extends Model { }

Sku.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		brand: {
			type: STRING,
			allowNull: true,
			comment: "brand of the sku"
		},
		weight: {
			type: STRING,
			allowNull: true,
			comment: "weight of the sku"
		},
		name: {
			type: STRING,
			allowNull: false,
			comment: "name of sku"
		},
		desc: {
			type: STRING,
			allowNull: true,
			comment: "desc of sku"
		},
		minQty: {
			type: FLOAT,
		}
	},
	{
		sequelize,
		comment: "To store all sku details",
		tableName: "sku",
		modelName: "sku"
	}
);

module.exports = Sku;
