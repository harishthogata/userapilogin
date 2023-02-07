const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is running at http://localhost:3000/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(-1);
  }
};

initializeDBAndServer();

//API 1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 30);
  const passwordLength = password.length;

  const checkUserDetails = `
    SELECT
    *
    FROM
    user
    WHERE
    username = '${username}';`;
  const dbUser = await db.get(checkUserDetails);

  if (dbUser === undefined) {
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createNewUser = `
            INSERT  INTO user(username, name, password, gender, location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}');`;
      await db.run(createNewUser);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserDetails = `
    SELECT
    *
    FROM
    user
    WHERE
    username = '${username}';`;
  const dbUser = await db.get(checkUserDetails);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserDetails = `
    SELECT
    *
    FROM
    user
    WHERE
    username = '${username}';`;
  const dbUser = await db.get(checkUserDetails);

  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatched === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePassword = `
                UPDATE 
                    user
                SET
                    password =${newPassword} 
                WHERE
                    username = ${username};`;

      await db.run(updatePassword);
      response.send("Login success!");
    }
  } else {
    response.status(400);
    response.send("Invalid password");
  }
});

module.exports = app;
