const fs = require("fs");
const bcrypt = require("bcryptjs");

const sql = fs.readFileSync("supabase/schema.sql", "utf8");
const match = sql.match(/\$2b\$12\$[A-Za-z0-9./]+/);
if (!match) {
  console.error("No hash found");
  process.exit(1);
}
const hash = match[0];
bcrypt.compare("kips@8888", hash).then((ok) => {
  console.log(hash);
  console.log("match", ok);
  process.exit(ok ? 0 : 1);
});
