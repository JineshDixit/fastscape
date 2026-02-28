"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_USER_ROLES_POLICIES_INCLUDE = void 0;
const models_1 = require("../../models");
exports.ADMIN_USER_ROLES_POLICIES_INCLUDE = [
    {
        model: models_1.Role,
        through: { attributes: [] },
        include: [
            {
                model: models_1.Policy,
                through: { attributes: [] },
                where: { isActive: true },
                required: false,
            },
        ],
        where: { isActive: true },
        required: false,
    },
];
//# sourceMappingURL=constants.js.map