var app = require("express")();
var PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };

  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let newKey = generateRandomString();
  while(Object.keys(urlDatabase).includes(newKey)){
    newKey = generateRandomString();
  }
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
    username: req.cookies["username"]
  };
  console.log(req.cookies["username"]);
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.listen(PORT);
console.log("Server listening at port", PORT);

//
function generateRandomString(){
  // shared by Andrew
  return Math.random().toString(36).slice(2,8);

}