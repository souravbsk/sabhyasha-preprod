const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const bcrypt = require("bcryptjs");
const { users } = require("../models/userModel");
require("dotenv").config();

// Passport Google strategy

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        let user = await users.findOne({
          email: profile?.emails[0]?.value,
        });

        if (!user) {
          // If user does not exist, create a new user
          const username = await profile?.emails[0]?.value?.split("@")[0];
          const newUser = new users({
            googleId: profile.id,
            displayName: profile.displayName,
            username: username,
            email: profile?.emails[0]?.value,
            isEmailVerify: profile?.emails[0]?.verified,
            avatar: profile?.photos[0]?.value,
            role: "user",
          });
          await newUser.save();
          return done(null, newUser);
        } else {
          // If user exists, update their Google sign-in information
          user.googleId = profile.id;
          user.displayName = profile.displayName;
          user.avatar = profile?.photos[0]?.value;
          user.isEmailVerify = profile?.emails[0]?.verified;
          await users.updateOne({ _id: user._id }, { $set: user });
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  new LocalStrategy(async (username, password, done) => {
    console.log(username);
    try {
      if (username && password) {
        // Check if username matches
        let user = await users.findOne({ username: username });
        console.log(user);
        // If username doesn't match, check if email matches

        if (!user) {
          user = await users.findOne({ email: username });
        }
        if (!user) {
          return done(null, false, { message: "Incorrect username or email." });
        }
        if (user.password) {
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (isPasswordValid) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Incorrect password." });
          }
        } else if (user?.googleId) {
          return done(null, false, { message: "please sign in with google" });
        }
      }
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
