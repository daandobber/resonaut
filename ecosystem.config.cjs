module.exports = {
  apps: [
    {
      name: 'resonaut-server',
      script: 'multiplayer-server.js',
      env: {
        WSS: '1'
      },
      watch: true,
      ignore_watch: ['node_modules', '.git', 'logs', 'public/config.json'],
      instances: 1,
      exec_mode: 'fork',
      out_file: 'logs/out.log',
      error_file: 'logs/err.log'
    }
  ]
};
