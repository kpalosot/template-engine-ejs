var app = require("express")();
var PORT = 8080;
const bodyParser = require("body-parser");
const uuid = require("uuid/v4");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");


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
    password: bcrypt.hashSync("dishwasher-funk", 10)
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
    let thisUser = getUserByID(req.session.user_id);
    let templateVars = {
      user: thisUser,
      urls: getAllUrlsByUserId(req.session.user_id),
      inRegister: false,
      inLogin: false
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: getUserByID(req.session.user_id),
    inRegister: false,
    inLogin: false,
    err: false
  };
  if(templateVars.user === null){
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }

});

app.post("/urls", (req, res) => {
  if(req.body.longURL === ""){
    let templateVars = {
      user: getUserByID(req.session.user_id),
      inRegister: false,
      inLogin: false,
      err: "Error 400: Please fill out all empty fields."
    };
    res.render("urls_new", templateVars);
  } else {
    let newKey = uuid().slice(0, 6);
    urlDatabase[newKey] = {
      id: req.session.user_id,
      longURL: req.body.longURL
    };
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  let thisUserURLS = getAllUrlsByUserId(req.session.user_id);
  if(thisUserURLS === undefined){
    res.redirect("/login");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }

});

app.post("/urls/:id/update", (req, res) => {
  let thisUserURLS = getAllUrlsByUserId(req.session.user_id);

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
    user: getUserByID(req.session.user_id),
    inRegister: false,
    inLogin: false,
    err: false
  };

  // scenario: another user sent their url page
  // to another client and client may or may not
  // be a user
  if(req.params.id !== req.session.user_id){
    templateVars.err = "The page you are accessing is forbidden.";
    if(templateVars.user === null){
      res.render("urls_register", templateVars);
    } else{
      res.render("urls_login", templateVars);
    }
  } else {
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  var templateVars = {
    user: null,
    inRegister: false,
    inLogin: true,
    err: false
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  let user = getUserByEmail(req.body.email);

  if(user && bcrypt.compareSync(req.body.password, user.password)){
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.render("urls_login", {
      err: "Error 403: Username or password is incorrect.",
      user: null,
      inLogin: true,
      inRegister: false
    });
  }
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: getUserByID(req.session.user_id),
    inRegister: true,
    inLogin: false,
    err: false
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let newUserID = uuid();
  users[newUserID] = {
    id: newUserID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };

  if(req.body.email === "" || req.body.password === ""){
    res.render("urls_register", {
      err: "Error 400: Please fill out all empty fields.",
      user: null,
      inLogin: true,
      inRegister: false
    });
  } else {
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

app.listen(PORT);
console.log("Server listening at port", PORT);
