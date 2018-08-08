var app = require("express")();
var PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const uuid = require("uuid/v4");


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
    inRegister: false
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    inRegister: false
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let newKey = uuid().slice(0, 6);
  urlDatabase[newKey] = req.body.longURL;
  let templateVars = { urls: urlDatabase};
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.updateURL;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
    inRegister: false
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    inRegister: true
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let newUserID = uuid();
  users[newUserID] = {
    id: newUserID,
    username: req.body.email,
    password: req.body.password
  };

  if(req.body.email === "" || req.body.password === ""){
    res.sendStatus(400);
  } else {
    res.cookie("username", users[newUserID].username);
    res.cookie("user_id", newUserID);
    res.redirect("/urls");
  }

});

app.listen(PORT);
console.log("Server listening at port", PORT);
