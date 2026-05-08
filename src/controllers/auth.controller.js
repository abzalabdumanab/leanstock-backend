const authService = require("../services/auth.service");

async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

async function verifyEmail(req, res) {
  const result = await authService.verifyEmail(req.query.token || req.body.token);
  res.json(result);
}

async function login(req, res) {
  const result = await authService.login(req.body);
  res.json(result);
}

async function refresh(req, res) {
  const tokens = await authService.refresh(req.body.refreshToken);
  res.json(tokens);
}

async function logout(req, res) {
  const result = await authService.logout(req.body.refreshToken);
  res.json(result);
}

async function requestPasswordReset(req, res) {
  const result = await authService.requestPasswordReset(req.body.email);
  res.json(result);
}

async function resetPassword(req, res) {
  const result = await authService.resetPassword(req.body);
  res.json(result);
}

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  requestPasswordReset,
  resetPassword
};
