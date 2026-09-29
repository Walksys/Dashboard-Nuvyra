const FREE_BACKUP_LIMIT = 1;

function isFreeServer(server) {
  return Boolean(server && (Number(server.is_free) === 1 || server.is_free === true));
}

function freeServerError(feature) {
  return `Free servers cannot use ${feature}. This feature is available on paid or administrator-managed servers.`;
}

module.exports = {
  FREE_BACKUP_LIMIT,
  isFreeServer,
  freeServerError
};
