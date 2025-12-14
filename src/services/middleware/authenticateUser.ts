import { RequestHandler } from "express";
import passport from "passport";

export const authenticateUser: RequestHandler = passport.authenticate("jwt", {
    session: false,
})