var app = require("express")();
var PORT = 8080;
const bodyParser = require("body-parser");
const uuid = require("uuid/v4");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");

const errorMessages = {
  "400": "Error 400: Please fill out all empty fields.",
  "401": "Error 401: Username or password is incorrect.",
  "403": "Error 403: The page you are accessing is forbidden.",
  "409": "Error 409: Email already exists."
};


var urlDatabase = {
  "b2xVn2": {
     id: "userRandomID",
     longURL: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
      id: "user2RandomID",
      longURL: "http://www.google.com"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("123", 10)
  }
};

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  keys: ["bfriends"]
}));

app.set("view engine", "ejs");

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if(req.session.user_id === undefined){

    res.redirect("/login");

  } else {

    const thisUser = getUserByID(req.session.user_id);
    const templateVars = createBaseTemplate();
    templateVars.user = thisUser;
    templateVars.urls = getAllUrlsByUserId(req.session.user_id);

    res.render("urls_index", templateVars);

  }

});

app.get("/urls/new", (req, res) => {

  const templateVars = createBaseTemplate();
  templateVars.user = getUserByID(req.session.user_id);

  if(templateVars.user === null){

    res.redirect("/login");

  } else {

    res.render("urls_new", templateVars);

  }

});

app.post("/urls", (req, res) => {

  if(req.body.longURL === ""){

    const templateVars = createBaseTemplate();
    templateVars.user = getUserByID(req.session.user_id);
    templateVars.err = errorMessages["400"];

    res.render("urls_new", templateVars);

  } else {

    const newKey = uuid().slice(0, 6);
    let thisURL = req.body.longURL;

    urlDatabase[newKey] = {
      id: req.session.user_id,
      longURL: req.body.longURL
    };

    res.redirect(`/urls/${newKey}`);

  }

});

app.post("/urls/:id/delete", (req, res) => {

  const thisUserURLS = getAllUrlsByUserId(req.session.user_id);

  const templateVars = createBaseTemplate();

  if(thisUserURLS === {}){

    templateVars.inRegister = true;

    res.render("urls_register", templateVars);

  } else if(!Object.keys(thisUserURLS).includes(req.params.id)){

    templateVars.user = getUserByID(req.session.user_id);
    templateVars.inLogin = true;
    templateVars.err = errorMessages["403"];

    res.render("urls_index", templateVars);

  } else {

    delete urlDatabase[req.params.id];

    res.redirect("/urls");

  }

});

app.post("/urls/:id/update", (req, res) => {

  const thisUserURLS = getAllUrlsByUserId(req.session.user_id);

  const templateVars = createBaseTemplate();

  if(thisUserURLS === {}){

    templateVars.inRegister = true;

    res.render("urls_register", templateVars);

  } else if(!Object.keys(thisUserURLS).includes(req.params.id)){

    templateVars.user = getUserByID(req.session.user_id);
    templateVars.inLogin = true;
    templateVars.err = errorMessages["403"];

    res.render("urls_index", templateVars);

  } else {

    urlDatabase[req.params.id].longURL = req.body.updateURL;
    res.redirect("/urls");

  }

});

app.get("/urls/:id", (req, res) => {

  const thisUser = getUserByID(req.session.user_id);
  const templateVars = createBaseTemplate();
  templateVars.user = thisUser;
  templateVars.urls = getAllUrlsByUserId(req.session.user_id);

  if(urlDatabase[req.params.id].id !== req.session.user_id){

    templateVars.err = errorMessages["403"];

    if(templateVars.user === null){

      res.render("urls_register", templateVars);

    } else{

      templateVars.urls = getAllUrlsByUserId(req.session.user_id);
      res.render("urls_index", templateVars);

    }

  } else {

    templateVars.shortURL = req.params.id;
    templateVars.longURL = urlDatabase[req.params.id].longURL;
    res.render("urls_show", templateVars);

  }

});

app.get("/u/:shortURL", (req, res) => {

  const longURL = urlDatabase[req.params.shortURL].longURL;

  res.redirect(longURL);

});

app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect("/urls");

});

app.get("/login", (req, res) => {

  const templateVars = createBaseTemplate();
  templateVars.user = null;
  templateVars.inLogin = true;

  if (req.session.user_id) {

    res.redirect("/urls");

  } else {

    res.render("urls_login", templateVars);

  }

});

app.post("/login", (req, res) => {

  const user = getUserByEmail(req.body.email);

  if(user && bcrypt.compareSync(req.body.password, user.password)){
    req.session.user_id = user.id;

    res.redirect("/urls");

  } else {

    const templateVars = createBaseTemplate();
    templateVars.err = errorMessages["401"];
    templateVars.user = null;
    templateVars.inLogin = true;

    res.render("urls_login", templateVars);

  }

});

app.get("/register", (req, res) => {

  if (req.session.user_id) {

    res.redirect("/urls");

  } else {

    const templateVars = createBaseTemplate();
    templateVars.inRegister = true;
    templateVars.user = null;

    res.render("urls_register", templateVars);

  }

});

app.post("/register", (req, res) => {

  const templateVars = createBaseTemplate();
  templateVars.user = null;
  templateVars.inLogin = true;

  if(req.body.email === "" || req.body.password === ""){

    templateVars.err = errorMessages["400"];

    res.render("urls_register", templateVars);

  } else if(getUserByEmail(req.body.email)){

    templateVars.err = errorMessages["409"];

    res.render("urls_register", templateVars);

  } else {

    const newUserID = uuid();

    users[newUserID] = {
      id: newUserID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };

    req.session.user_id = newUserID;

    res.redirect("/urls");

  }

});

app.get("/", (req, res) => {

  res.redirect("/urls");

});

/********************************************
***********  HELPER FUNCTIONS!!!! ***********
*********************************************/

function getUserByEmail(email){

  let thisUser = null;

  Object.keys(users).forEach((user) => {

    if(users[user].email === email){

      thisUser = users[user];

    }

  });

  return thisUser;
}

function getUserByID(userID){

  if(users[userID]){

    return users[userID];

  }

  return null;

}

function getAllUrlsByUserId(userid){

  let urls = {};

  Object.keys(urlDatabase).forEach((shortURL) => {

    if (urlDatabase[shortURL].id === userid) {

      urls[shortURL] = urlDatabase[shortURL].longURL;

    }

  });

  return urls;

}

function createBaseTemplate(){
  return {
    inRegister: false,
    inLogin: false,
    err: false
  }
}

app.listen(PORT);
console.log("Server listening at port", PORT);
