"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
class LocationService {
    /**
     * Get all active locations with optional filtering
     * @param query - Query parameters (type, city)
     */
    getLocations(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { city } = query;
            const whereClause = {
                isActive: true,
            };
            if (city) {
                whereClause.city = { [sequelize_1.Op.iLike]: `%${city}%` };
            }
            const locations = yield models_1.Location.findAll({
                where: whereClause,
                order: [['name', 'ASC']],
            });
            return locations;
        });
    }
}
exports.locationService = new LocationService();
//# sourceMappingURL=location.service.js.map