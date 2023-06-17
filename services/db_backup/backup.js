const exec = require('child_process').exec;

const backupDatabase = () => {
const command = `mysqldump -u root login_form > C:/backups/backup.sql`;
    exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup failed: ${error}`);
    } else {
      console.log(`Backup successful: ${stdout}`);
    }
  });
};

module.exports = backupDatabase;