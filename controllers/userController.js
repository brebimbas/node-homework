function register(req, res) {
  const { name, email, password } = req.body;
  const newUser = {
    id: global.user_id,
    name,
    email,
    password,
  };

  global.users.push(newUser);
  global.user_id++;
  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
}

function logon(req, res) {
  const { email, password } = req.body;
  const user = global.users.find((user) => user.email === email);

  if (user && user.password === password) {
    global.user_id = user.id;
    res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(401).json({
      message: "Email or Password does not match",
    });
  }
}

function logoff(req, res) {
  global.user_id = null;
  res.status(200).json({
    message: "User successfully signed off",
  });
}

module.exports = {
  register,
  logon,
  logoff,
};
