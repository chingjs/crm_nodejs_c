const { Model, DataTypes, BOOLEAN } = require("sequelize");
const sequelize = require("../../sequelize");

const { UUID, UUIDV4, STRING } = DataTypes;

class CategoryChoice extends Model {}

CategoryChoice.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		name: {
			type: STRING,
			allowNull: true,
			comment: "Category Choice name"
		},
		bmName: {
			type: STRING,
			allowNull: true,
			comment: "Kategori Pilihan"
		},
		chName: {
			type: STRING,
			allowNull: true,
			comment: "品类选择"
		},
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "point shop category choice",
		tableName: "categoryChoice",
		modelName: "categoryChoice"
	}
);

module.exports = CategoryChoice;
