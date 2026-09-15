/** Usage: node scripts/print-admin-hash.cjs [password] */
const bcrypt = require("bcryptjs");

const password = process.argv[2] || "kips@8888";

bcrypt.hash(password, 12).then((hash) => {
  console.log("Hash for password:", password);
  console.log(hash);
  console.log("\nSQL:");
  console.log(
    `update public.admins set password_hash = '${hash}' where username = 'kips@7777';`
  );
});
