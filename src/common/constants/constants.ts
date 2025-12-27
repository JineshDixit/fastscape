import { Includeable } from "sequelize";
import { Policy, Role } from "../../models";

export const ADMIN_USER_ROLES_POLICIES_INCLUDE: Includeable[] = [
  {
    model: Role,
    through: { attributes: [] },
    include: [
      {
        model: Policy,
        through: { attributes: [] },
        where: { isActive: true },
        required: false,
      }
    ],
    where: { isActive: true },
    required: false,
  }
];