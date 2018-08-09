var app = require("express")();
var PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const uuid = require("uuid/v4");

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
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if(req.cookies["user_id"] === undefined){
    res.redirect("/login");
  } else {
    let thisUser = getUserByID(req.cookies["user_id"]);
    let templateVars = {
      user: thisUser,
      urls: getAllUrlsByUserId(req.cookies["user_id"]),
      inRegister: false,
      inLogin: false
    };

    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: getUserByID(req.cookies["user_id"]),
    inRegister: false,
    inLogin: false
  };
  if(templateVars.user === null){
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }

});

app.post("/urls", (req, res) => {
  let newKey = uuid().slice(0, 6);
  urlDatabase[newKey] = {
    id: req.cookies["user_id"],
    longURL: req.body.longURL
  };
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  let thisUserID = req.cookies["user_id"];
  let thisUserURLS = getAllUrlsByUserId(thisUserID);
  if(thisUserURLS === undefined){
    res.redirect("/login");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }

});

app.post("/urls/:id/update", (req, res) => {
  let thisUserID = req.cookies["user_id"];
  let thisUserURLS = getAllUrlsByUserId(thisUserID);

  if(thisUserURLS === undefined){
    res.redirect("/login");
  } else {
    urlDatabase[req.params.id].longURL = req.body.updateURL;
    res.redirect("/urls");
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: getUserByID(req.cookies["user_id"]),
    inRegister: false,
    inLogin: false
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  var templateVars = {
    user: null,
    inRegister: false,
    inLogin: true
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  let user = getUserByEmail(req.body.email);
  if(user && isCorrectPassword(user, req.body.password)){
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  } else {
    res.sendStatus(403);
  }
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: getUserByID(req.cookies["user_id"]),
    inRegister: true,
    inLogin: false
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let newUserID = uuid();
  users[newUserID] = {
    id: newUserID,
    email: req.body.email,
    password: req.body.password
  };

  if(req.body.email === "" || req.body.password === ""){
    res.sendStatus(400);
  } else {
    res.cookie("user_id", newUserID);
    res.redirect("/urls");
  }

});

app.get("/", (req, res) => {
  res.render("urls_welcome");
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

function isCorrectPassword(user, password){
  return user.password === password;
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

app.listen(PORT);
console.log("Server listening at port", PORT);
