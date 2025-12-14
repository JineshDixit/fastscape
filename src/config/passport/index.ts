import { ExtractJwt, Strategy as JwtStrategy, StrategyOptions } from "passport-jwt";
import "./config/env/envConfig";
import passport from "passport";

const JWT_SECRET = process.env.JWT_SECRET;

const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
};

/**
 * Configure passport to use JWT strategy
 * @returns {void} - Nothing is returned
 */
export const configPassport = () => {
    passport.use(
        new JwtStrategy(options, (jwtPayload, done) => {
            //TODO: Implement user fetching logic here
            return done(null, false);
        })
    )
}