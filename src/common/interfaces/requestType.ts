import { AdminUserResponse } from "./authTypes";

export interface AuthenticatedRequest extends Request {
  user?: AdminUserResponse;
}