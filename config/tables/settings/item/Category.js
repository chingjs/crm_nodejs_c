const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../../sequelize");

const { UUID, UUIDV4, STRING ,BOOLEAN} = DataTypes;

class Category extends Model {}

Category.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		name: {
			type: STRING,
			allowNull: false,
			comment: "category name"
		},
		active: {
			type: BOOLEAN,
			allowNull: true,
			defaultValue: true,
			comment: "category name"
		},
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "point shop category",
		tableName: "category",
		modelName: "category"
	}
);

module.exports = Category;
